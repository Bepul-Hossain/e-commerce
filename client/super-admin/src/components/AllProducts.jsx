import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { baseURLFile } from "../helper/config";
import { DeleteAlert } from "../helper/helper";
import Paginate from "../helper/Paginate";
import productStore from "../store/productStore";
import brandStore from "../store/brandStore";
import categoryStore from "../store/categoryStore";
import ProductForm from "./ProductForm";
import { productToForm } from "../helper/productForm";

const PER_PAGE = 10;

const formatPrice = (n) => `৳${Number(n || 0).toLocaleString()}`;

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filters live in the URL so they survive refresh and Back/Forward
  const page_no = Number(searchParams.get("page_no")) || 1;
  const keyword = searchParams.get("keyword") || "";
  const category_id = searchParams.get("category_id") || "";
  const brand_id = searchParams.get("brand_id") || "";

  const setFilters = (changes) => {
    const next = { keyword, category_id, brand_id, page_no, ...changes };
    const params = new URLSearchParams();
    if (next.keyword) params.set("keyword", next.keyword);
    if (next.category_id) params.set("category_id", next.category_id);
    if (next.brand_id) params.set("brand_id", next.brand_id);
    params.set("page_no", next.page_no);
    navigate(`/all-product?${params.toString()}`);
  };

  const {
    allProducts,
    totalProducts,
    allProductsRequest,
    deleteProductRequest,
    singleProductRequest,
    updateProductRequest,
  } = productStore();
  const { brandList, brandListRequest } = brandStore();
  const { categoryList, categoryListRequest } = categoryStore();

  const [loading, setLoading] = useState(true);
  const loadProducts = async () => {
    setLoading(true);
    await allProductsRequest(category_id, brand_id, 0, keyword, PER_PAGE, page_no);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page_no, keyword, category_id, brand_id]);

  useEffect(() => {
    brandListRequest();
    categoryListRequest();
  }, [brandListRequest, categoryListRequest]);

  // ---- search box (debounced, synced with the URL) ----
  const [searchText, setSearchText] = useState(keyword);
  useEffect(() => {
    setSearchText((prev) => (prev.trim() === keyword ? prev : keyword));
  }, [keyword]);
  useEffect(() => {
    const kw = searchText.trim();
    if (kw === keyword) return;
    const timer = setTimeout(() => setFilters({ keyword: kw, page_no: 1 }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, keyword]);

  const hasFilters = keyword || category_id || brand_id;

  // ---- delete ----
  const deleteProduct = async (id) => {
    const res = await DeleteAlert(deleteProductRequest, id);
    if (res) {
      // Last item on a later page: step back a page, else reload this one
      if (allProducts?.length === 1 && page_no > 1) setFilters({ page_no: page_no - 1 });
      else await loadProducts();
    }
  };

  // ---- edit modal ----
  const [editId, setEditId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [updating, setUpdating] = useState(false);

  const openEdit = async (id) => {
    const product = await singleProductRequest(id);
    if (product) {
      setEditValues(productToForm(product));
      setEditId(id);
    }
  };

  const closeEdit = () => {
    setEditId(null);
    setEditValues(null);
  };

  const handleUpdate = async (payload) => {
    setUpdating(true);
    const ok = await updateProductRequest(editId, payload);
    setUpdating(false);
    if (ok) {
      closeEdit();
      await loadProducts();
    }
    return ok;
  };

  useEffect(() => {
    if (!editId) return;
    const onKey = (e) => e.key === "Escape" && !updating && closeEdit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editId, updating]);

  return (
    <>
      {/* Cover Photo Start */}
      <div className="cover-photo  overflow-hidden">
        <div className="avatar-upload p-5">
          <h2>Supper Admin</h2>
          <h5>All Product</h5>
        </div>
      </div>
      <div className="dashboard-body__content mt-0">
        <div className="row gy-4">
          <div className="col-12">
            <div className="card common-card border border-gray-five">
              <div className="card-body">
                {/* Filters */}
                <div className="row g-3 align-items-center mb-4">
                  <div className="col-12 col-lg-4">
                    <div className="input-group">
                      <input
                        type="search"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setFilters({ keyword: searchText.trim(), page_no: 1 });
                        }}
                        className="form-control"
                        placeholder="Search by title..."
                        aria-label="Search products by title"
                      />
                      {searchText && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchText("");
                            setFilters({ keyword: "", page_no: 1 });
                          }}
                          className="btn btn-outline-secondary"
                          aria-label="Clear search"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <select
                      value={category_id}
                      onChange={(e) => setFilters({ category_id: e.target.value, page_no: 1 })}
                      className="form-select"
                      aria-label="Filter by category"
                    >
                      <option value="">All categories</option>
                      {categoryList?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6 col-lg-3">
                    <select
                      value={brand_id}
                      onChange={(e) => setFilters({ brand_id: e.target.value, page_no: 1 })}
                      className="form-select"
                      aria-label="Filter by brand"
                    >
                      <option value="">All brands</option>
                      {brandList?.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.brand_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-lg-2 d-flex gap-2 justify-content-lg-end">
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchText("");
                          setFilters({ keyword: "", category_id: "", brand_id: "", page_no: 1 });
                        }}
                        className="btn btn-outline-secondary"
                      >
                        Reset
                      </button>
                    )}
                    <Link to="/create-product" className="btn btn-main">
                      + New
                    </Link>
                  </div>
                </div>

                <p className="text-muted small mb-2">
                  {loading && allProducts === null
                    ? "Loading..."
                    : `${totalProducts || 0} product${totalProducts === 1 ? "" : "s"} found`}
                </p>

                <div className="table-responsive">
                  <table className="table text-body align-middle">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Brand</th>
                        <th>Price</th>
                        <th>Discount</th>
                        <th>Stock</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && allProducts === null &&
                        [...Array(5)].map((_, i) => (
                          <tr key={i}>
                            <td colSpan={8}>
                              <Skeleton height={40} />
                            </td>
                          </tr>
                        ))}

                      {!loading && allProducts?.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center text-muted py-4">
                            {hasFilters ? "No products match these filters" : "No products yet"}
                          </td>
                        </tr>
                      )}

                      {allProducts?.map((item) => (
                        <tr
                          key={item._id}
                          className="super_admin_all-product"
                          style={{ opacity: loading ? 0.5 : 1 }}
                        >
                          <td>
                            {item.images?.[0] ? (
                              <img
                                src={`${baseURLFile}/${item.images[0]}`}
                                alt={item.title}
                                className="cover-img rounded"
                                style={{ width: 60, height: 60, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded border bg-light"
                                style={{ width: 60, height: 60 }}
                              />
                            )}
                          </td>
                          <td style={{ minWidth: 180 }}>
                            <h6 className="product-item__title mb-0">
                              {/* Opens the product on the e-commerce site */}
                              <a
                                href={`/product-details?product_id=${item._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="link"
                              >
                                {item.title}
                              </a>
                            </h6>
                            {item.remark && (
                              <span className="badge bg-secondary mt-1">{item.remark}</span>
                            )}
                          </td>
                          <td>{item.category?.[0]?.category_name || "—"}</td>
                          <td>{item.brand?.[0]?.brand_name || "—"}</td>
                          <td>
                            {item.is_discount ? (
                              <div className="d-flex flex-column">
                                <span className="fw-600">{formatPrice(item.discount_price)}</span>
                                <span className="font-12 text-danger text-decoration-line-through">
                                  {formatPrice(item.price)}
                                </span>
                              </div>
                            ) : (
                              <span className="fw-600">{formatPrice(item.price)}</span>
                            )}
                          </td>
                          <td>{item.is_discount ? "Yes" : "No"}</td>
                          <td>
                            <span className={item.stock > 0 ? "" : "text-danger fw-600"}>
                              {item.stock > 0 ? item.stock : "Out of stock"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                className="btn btn-success"
                                onClick={() => openEdit(item._id)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => deleteProduct(item._id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalProducts > PER_PAGE && (
                  <div className="flx-between justify-content-end gap-2">
                    <nav aria-label="Product pages">
                      <Paginate
                        handelPageClick={(e) => setFilters({ page_no: e.selected + 1 })}
                        page_no={page_no}
                        per_page={PER_PAGE}
                        totalCount={totalProducts}
                      />
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update product modal (React-controlled, closes only on success) */}
      {editId && editValues && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="updateProductTitle"
            onClick={(e) => e.target === e.currentTarget && !updating && closeEdit()}
          >
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title fs-5" id="updateProductTitle">
                    Update Product
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeEdit}
                    disabled={updating}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <ProductForm
                    key={editId}
                    initialValues={editValues}
                    onSubmit={handleUpdate}
                    loading={updating}
                    submitLabel="Update Product"
                    loadingLabel="Updating..."
                    onCancel={closeEdit}
                  />
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

export default AllProducts;
