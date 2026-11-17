import { useNavigate } from "react-router-dom";
import productStore from "../store/productStore";
import ProductForm from "./ProductForm";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { createProductLoading, createProductRequest } = productStore();

  const handleCreate = async (payload) => {
    const ok = await createProductRequest(payload);
    if (ok) navigate("/all-product");
    return ok;
  };

  return (
    <>
      {/* Cover Photo Start */}
      <div className="cover-photo  overflow-hidden">
        <div className="avatar-upload p-5 mb-5">
          <h2>Supper Admin</h2>
          <h5>Create Product</h5>
        </div>
      </div>
      {/* Cover Photo End */}
      <div className="dashboard-body__content profile-content-wrapper z-index-1 position-relative mt--100 pt-2">
        {/* Profile Content Start */}
        <div className="profile">
          <div className="row gy-4">
            <div className="col-12">
              <div className="dashboard-card">
                <div className="profile-info-content">
                  <ProductForm
                    onSubmit={handleCreate}
                    loading={createProductLoading}
                    submitLabel="Create Product"
                    loadingLabel="Creating..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Content End */}
      </div>
    </>
  );
};

export default CreateProduct;
