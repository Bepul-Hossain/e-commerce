import { useEffect, useState } from "react";
import { baseURLFile } from "../helper/config";
import Paginate from "../helper/Paginate";
import categoryStore from "../store/categoryStore";
import { DeleteAlert, ErrorToast, IsEmpty } from "../helper/helper";
import ImagePicker from "./ImagePicker";

const PER_PAGE = 10;
const EMPTY_CATEGORY = { category_name: "", category_img: "" };

// category_img is a single filename from the File Manager
const validate = (category) => {
  if (IsEmpty(category.category_name.trim())) return "Category name is required!";
  if (IsEmpty(category.category_img)) return "Category image is required!";
  return null;
};

// ImagePicker works with arrays; category_img is one filename
const toPickerValue = (category_img) => (category_img ? [category_img] : []);
const fromPickerValue = (arr) => arr[0] || "";

const Category = () => {
  let {
    createCategoryLoading,
    createCategoryRequest,
    allCategoryRequest,
    allCategory,
    totalCategory,
    deleteCategoryRequest,
    updateCategoryRequest,
    singleCategoryRequest,
  } = categoryStore();

  const [page_no, setPageNo] = useState(1);

  // Create form and edit modal have separate state, so opening "Edit"
  // doesn't overwrite what's typed in the create form
  const [createData, setCreateData] = useState(EMPTY_CATEGORY);
  const [editData, setEditData] = useState(EMPTY_CATEGORY);
  const [editId, setEditId] = useState(null); // null = modal closed
  const [updating, setUpdating] = useState(false);

  const loadCategories = (page = page_no) => allCategoryRequest(PER_PAGE, page);

  useEffect(() => {
    loadCategories(page_no);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page_no]);

  // create category
  const categorySubmit = async () => {
    const error = validate(createData);
    if (error) return ErrorToast(error);

    const res = await createCategoryRequest({
      category_name: createData.category_name.trim(),
      category_img: createData.category_img,
    });
    if (res) {
      setCreateData(EMPTY_CATEGORY);
      // Newest categories come first, so show page 1
      if (page_no === 1) await loadCategories(1);
      else setPageNo(1);
    }
  };

  // delete category (DeleteAlert confirms, then calls the API once)
  const deleteCategory = async (id) => {
    const res = await DeleteAlert(deleteCategoryRequest, id);
    if (res) {
      // If that was the last category on this page, go back one page
      if (allCategory?.length === 1 && page_no > 1) setPageNo(page_no - 1);
      else await loadCategories();
    }
  };

  // open edit modal with the category's current data
  const openEdit = async (id) => {
    const res = await singleCategoryRequest(id);
    if (res) {
      setEditData({
        category_name: res.category_name || "",
        category_img: res.category_img || "",
      });
      setEditId(res._id);
    }
  };

  const closeEdit = () => {
    setEditId(null);
    setEditData(EMPTY_CATEGORY);
  };

  // update category; the modal only closes on success
  const updateCategory = async () => {
    const error = validate(editData);
    if (error) return ErrorToast(error);

    setUpdating(true);
    const res = await updateCategoryRequest(editId, {
      category_name: editData.category_name.trim(),
      category_img: editData.category_img,
    });
    setUpdating(false);
    if (res) {
      closeEdit();
      await loadCategories();
    }
  };

  // Close the modal with Escape
  useEffect(() => {
    if (!editId) return;
    const onKey = (e) => e.key === "Escape" && closeEdit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editId]);

  return (
    <>
      {/* Cover Photo Start */}
      <div className="cover-photo  overflow-hidden">
        <div className="avatar-upload p-5 mb-5">
          <h2>Supper Admin</h2>
          <h5>Create Category</h5>
        </div>
      </div>
      {/* Cover Photo End */}
      <div className="dashboard-body__content profile-content-wrapper z-index-1 position-relative mt--100 pt-2">
        {/* Profile Content Start */}
        <div className="profile">
          <div className="row gy-4">
            <div className="col-12 ">
              <div className="dashboard-card">
                <div className="profile-info-content">
                  <div className="row gy-4">
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Category name
                      </label>
                      <input
                        value={createData.category_name}
                        onChange={(e) => setCreateData({ ...createData, category_name: e.target.value })}
                        type="text"
                        className="common-input border"
                        placeholder="Ex: Baby Collection"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Category image (search and click to select one)
                      </label>
                      <ImagePicker
                        multiple={false}
                        value={toPickerValue(createData.category_img)}
                        onChange={(arr) => setCreateData({ ...createData, category_img: fromPickerValue(arr) })}
                      />
                    </div>

                    <div className="col-sm-12 text-end">
                      <button
                        onClick={categorySubmit}
                        disabled={createCategoryLoading}
                        className="btn btn-main btn-lg pill mt-4 "
                      >
                        {createCategoryLoading ? "Creating..." : "Create Category"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 ">
              <div className="card common-card border border-gray-five">
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table text-body ">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Category Name</th>
                          <th>Products</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCategory?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted">
                              No categories yet
                            </td>
                          </tr>
                        )}
                        {allCategory?.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div className="img-100">
                                <img
                                  src={`${baseURLFile}/${item.category_img}`}
                                  alt={item.category_name}
                                />
                              </div>
                            </td>
                            <td>{item.category_name}</td>
                            <td>{item.totalCount ?? 0}</td>
                            <td>
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  onClick={() => openEdit(item._id)}
                                  className="btn btn-success"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteCategory(item._id)}
                                  className="btn btn-danger"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {totalCategory > PER_PAGE && (
                      <div className="flx-between justify-content-end gap-2">
                        <nav aria-label="Category pages">
                          <Paginate
                            handelPageClick={(e) => setPageNo(e.selected + 1)}
                            page_no={page_no}
                            per_page={PER_PAGE}
                            totalCount={totalCategory}
                          />
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Content End */}
      </div>

      {/* Category update modal (React-controlled, closes only on success) */}
      {editId && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="updateCategoryTitle"
            onClick={(e) => e.target === e.currentTarget && closeEdit()}
          >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fs-5" id="updateCategoryTitle">
                    Update Category
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEdit}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="row gy-4">
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Category name
                      </label>
                      <input
                        onChange={(e) => setEditData({ ...editData, category_name: e.target.value })}
                        value={editData.category_name}
                        type="text"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Category image
                      </label>
                      <ImagePicker
                        multiple={false}
                        value={toPickerValue(editData.category_img)}
                        onChange={(arr) => setEditData({ ...editData, category_img: fromPickerValue(arr) })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEdit}
                  >
                    Close
                  </button>
                  <button
                    onClick={updateCategory}
                    disabled={updating}
                    type="button"
                    className="btn btn-primary"
                  >
                    {updating ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  );
};

export default Category;
