import { useEffect, useState } from "react";
import { baseURLFile } from "../helper/config";
import Paginate from "../helper/Paginate";
import brandStore from "../store/brandStore";
import { DeleteAlert, ErrorToast, IsEmpty } from "../helper/helper";

const Brand = () => {

  let {
    createBrandLoading,
    createBrandRequest,
    allBrandRequest,
    allBrand,
    totalBrand,
    deleteBrandRequest,
    updateBrandRequest,
    singleBrandRequest
  } = brandStore();

  let [data, setData] = useState({ brand_name: "", brand_img: "" });
  const [pagination, setPagination] = useState({
    page_no: 1,
    per_page: 10,
  });
  const validations = [
    { field: data.brand_name, message: "Brand name is required!" },
    { field: data.brand_img, message: "Brand image is required!" },
  ]
  let brandSubmit = async () => {
    for (const { field, message } of validations) {
      if (IsEmpty(field)) {
        return ErrorToast(message);
      }
    }
    await createBrandRequest(data);
  }
  useEffect(() => {
    (async () => {
      await allBrandRequest(pagination.per_page,
        pagination.page_no);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // delete brand
  let deleteBrand = async (id) => {
    let res = await DeleteAlert(deleteBrandRequest, id);
    if (res) {
      await deleteBrandRequest(id);
    }
  }
  // read single brand
  let [_id, setId] = useState("");
  let readSingleBrand = async (_id) => {
    let res = await singleBrandRequest(_id);
    if (res) {
      setId(res._id);
      setData({
        brand_name: res.brand_name,
        brand_img: res.brand_img,
      });
    }
  }
  // update brand
  let updateBrand = async () => {
    let res = await updateBrandRequest(_id, data);
    if (res) {
      await allBrandRequest(pagination.per_page, pagination.page_no);
    }
  }
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
                  <div className="tab-content" id="pills-tabContent">
                    <div className="tab-pane fade show active">
                      <div>
                        <div className="row gy-4">
                          <div className="col-md-6">
                            <label className="form-label mb-2 font-18 font-heading fw-600">
                              Brand name
                            </label>
                            <input
                              onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                              type="text"
                              className="common-input border"
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label mb-2 font-18 font-heading fw-600">
                              Image Single
                            </label>
                            <input
                              onChange={(e) => setData({ ...data, brand_img: e.target.value })}
                              type="text"
                              className="common-input border"
                            />
                          </div>

                          <div className="col-sm-12 text-end">
                            <button onClick={brandSubmit} className="btn btn-main btn-lg pill mt-4 ">
                              Create Brand
                            </button>
                          </div>
                        </div>
                      </div>
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
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBrand && allBrand.map((item, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <div className="img-100">
                                  <img
                                    src={item.brand_img}
                                    alt=""
                                  />
                                </div>
                              </td>
                              <td>{item.brand_name}</td>
                              <td>
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    onClick={() => readSingleBrand(item._id)}
                                    className="btn btn-success"
                                    data-bs-toggle="modal"
                                    data-bs-target={`#exampleModal_${1}`}
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
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="flx-between justify-content-end gap-2">
                      <nav aria-label="Page navigation example">
                        <div>
                          <Paginate
                            page_no={1}
                            per_page={5}
                            totalCount={10}
                          />
                        </div>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Content End */}
      </div>

      {/* Brand update section */}
      <>
        <div
          className="modal fade"
          id={`exampleModal_${1}`}
          tabIndex={-1}
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fs-5" id="exampleModalLabel">
                  Update Brand
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="dashboard-card">
                  <div className="profile-info-content">
                    <div className="tab-content" id="pills-tabContent">
                      <div className="tab-pane fade show active">
                        <div>
                          <div className="row gy-4">
                            <div className="col-md-6">
                              <label className="form-label mb-2 font-18 font-heading fw-600">
                                Brand name
                              </label>
                              <input
                                onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                                value={data.brand_name}
                                type="text"
                                className="common-input border"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label mb-2 font-18 font-heading fw-600">
                                Image Single
                              </label>
                              <input
                                onChange={(e) => setData({ ...data, brand_img: e.target.value })}
                                value={data.brand_img}
                                type="text"
                                className="common-input border"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <button
                  onClick={updateBrand}
                  type="button"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                >
                  Update Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </>
  );
};

export default Brand;
