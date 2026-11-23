import { useEffect, useState } from "react";
import { baseURLFile } from "../helper/config";
import Paginate from "../helper/Paginate";
import brandStore from "../store/brandStore";
import { DeleteAlert, ErrorToast, IsEmpty } from "../helper/helper";
import ImagePicker from "./ImagePicker";

const PER_PAGE = 10;
const EMPTY_BRAND = { brand_name: "", brand_img: "" };

// brand_img is a single filename from the File Manager
const validate = (brand) => {
  if (IsEmpty(brand.brand_name.trim())) return "Brand name is required!";
  if (IsEmpty(brand.brand_img)) return "Brand image is required!";
  return null;
};

// ImagePicker works with arrays; brand_img is one filename
const toPickerValue = (brand_img) => (brand_img ? [brand_img] : []);
const fromPickerValue = (arr) => arr[0] || "";

const Brand = () => {
  let {
    createBrandLoading,
    createBrandRequest,
    allBrandRequest,
    allBrand,
    totalBrand,
    deleteBrandRequest,
    updateBrandRequest,
    singleBrandRequest,
  } = brandStore();

  const [page_no, setPageNo] = useState(1);

  // Create form and edit modal have separate state, so opening "Edit"
  // doesn't overwrite what's typed in the create form
  const [createData, setCreateData] = useState(EMPTY_BRAND);
  const [editData, setEditData] = useState(EMPTY_BRAND);
  const [editId, setEditId] = useState(null); // null = modal closed
  const [updating, setUpdating] = useState(false);

  const loadBrands = (page = page_no) => allBrandRequest(PER_PAGE, page);

  useEffect(() => {
    loadBrands(page_no);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page_no]);

  // create brand
  const brandSubmit = async () => {
    const error = validate(createData);
    if (error) return ErrorToast(error);

    const res = await createBrandRequest({
      brand_name: createData.brand_name.trim(),
      brand_img: createData.brand_img,
    });
    if (res) {
      setCreateData(EMPTY_BRAND);
      // Newest brands come first, so show page 1
      if (page_no === 1) await loadBrands(1);
      else setPageNo(1);
    }
  };

  // delete brand (DeleteAlert confirms, then calls the API once)
  const deleteBrand = async (id) => {
    const res = await DeleteAlert(deleteBrandRequest, id);
    if (res) {
      // If that was the last brand on this page, go back one page
      if (allBrand?.length === 1 && page_no > 1) setPageNo(page_no - 1);
      else await loadBrands();
    }
  };

  // open edit modal with the brand's current data
  const openEdit = async (id) => {
    const res = await singleBrandRequest(id);
    if (res) {
      setEditData({ brand_name: res.brand_name || "", brand_img: res.brand_img || "" });
      setEditId(res._id);
    }
  };

  const closeEdit = () => {
    setEditId(null);
    setEditData(EMPTY_BRAND);
  };

  // update brand; the modal only closes on success
  const updateBrand = async () => {
    const error = validate(editData);
    if (error) return ErrorToast(error);

    setUpdating(true);
    const res = await updateBrandRequest(editId, {
      brand_name: editData.brand_name.trim(),
      brand_img: editData.brand_img,
    });
    setUpdating(false);
    if (res) {
      closeEdit();
      await loadBrands();
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
          <h5>Create Brand</h5>
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
                        Brand name
                      </label>
                      <input
                        value={createData.brand_name}
                        onChange={(e) => setCreateData({ ...createData, brand_name: e.target.value })}
                        type="text"
                        className="common-input border"
                        placeholder="Ex: Apna"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Brand image (search and click to select one)
                      </label>
                      <ImagePicker
                        multiple={false}
                        value={toPickerValue(createData.brand_img)}
                        onChange={(arr) => setCreateData({ ...createData, brand_img: fromPickerValue(arr) })}
                      />
                    </div>

                    <div className="col-sm-12 text-end">
                      <button
                        onClick={brandSubmit}
                        disabled={createBrandLoading}
                        className="btn btn-main btn-lg pill mt-4 "
                      >
                        {createBrandLoading ? "Creating..." : "Create Brand"}
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
                          <th>Brand Name</th>
                          <th>Products</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBrand?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted">
                              No brands yet
                            </td>
                          </tr>
                        )}
                        {allBrand?.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div className="img-100">
                                <img
                                  src={`${baseURLFile}/${item.brand_img}`}
                                  alt={item.brand_name}
                                />
                              </div>
                            </td>
                            <td>{item.brand_name}</td>
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
                                  onClick={() => deleteBrand(item._id)}
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
                    {totalBrand > PER_PAGE && (
                      <div className="flx-between justify-content-end gap-2">
                        <nav aria-label="Brand pages">
                          <Paginate
                            handelPageClick={(e) => setPageNo(e.selected + 1)}
                            page_no={page_no}
                            per_page={PER_PAGE}
                            totalCount={totalBrand}
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

      {/* Brand update modal (React-controlled, closes only on success) */}
      {editId && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="updateBrandTitle"
            onClick={(e) => e.target === e.currentTarget && closeEdit()}
          >
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fs-5" id="updateBrandTitle">
                    Update Brand
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
                        Brand name
                      </label>
                      <input
                        onChange={(e) => setEditData({ ...editData, brand_name: e.target.value })}
                        value={editData.brand_name}
                        type="text"
                        className="common-input border"
                        placeholder="Ex: Apna"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Brand image
                      </label>
                      <ImagePicker
                        multiple={false}
                        value={toPickerValue(editData.brand_img)}
                        onChange={(arr) => setEditData({ ...editData, brand_img: fromPickerValue(arr) })}
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
                    onClick={updateBrand}
                    disabled={updating}
                    type="button"
                    className="btn btn-primary"
                  >
                    {updating ? "Updating..." : "Update Brand"}
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

export default Brand;
