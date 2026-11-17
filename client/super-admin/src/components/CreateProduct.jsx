import ReactQuill from "react-quill-new";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorToast, formats, modules } from "../helper/helper";
import ImagePicker from "./ImagePicker";
import brandStore from "../store/brandStore";
import categoryStore from "../store/categoryStore";
import productStore from "../store/productStore";

const EMPTY_PRODUCT = {
  title: "",
  short_description: "",
  images: [], // selected filenames, e.g. ["api-img-1-a.png"]; first = main image
  price: "",
  is_discount: false,
  discount_price: "",
  category_id: "",
  brand_id: "",
  remark: "",
  stock: "",
  color: "", // comma separated in the input, sent as an array
  size: "",
  description: "", // HTML from the rich text editor
};

// "Red, Green ,, Blue" -> ["Red", "Green", "Blue"]
const splitList = (text) =>
  text.split(",").map((s) => s.trim()).filter(Boolean);

// Quill leaves "<p><br></p>" when the editor is visually empty
const isEditorEmpty = (html) =>
  html.replace(/<(.|\n)*?>/g, "").trim().length === 0;

// Same rules as the API, so most mistakes are caught before the request
const validate = (d) => {
  if (!d.title.trim()) return "Title is required!";
  if (d.images.length === 0) return "Please select at least one image!";
  if (d.price === "" || Number(d.price) < 0) return "Price is required!";
  if (d.is_discount) {
    if (d.discount_price === "" || Number(d.discount_price) < 0)
      return "Discount price is required when discount is on!";
    if (Number(d.discount_price) >= Number(d.price))
      return "Discount price should be less than the price!";
  }
  if (!d.category_id) return "Please select a category!";
  if (!d.brand_id) return "Please select a brand!";
  if (d.stock === "" || !Number.isInteger(Number(d.stock)) || Number(d.stock) < 0)
    return "Stock must be a whole number of 0 or more!";
  return null;
};

const CreateProduct = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY_PRODUCT);

  // Update one field: set("title")("New title")
  const set = (field) => (value) => setData((prev) => ({ ...prev, [field]: value }));
  // For plain inputs/selects: onChange={onInput("title")}
  const onInput = (field) => (e) => set(field)(e.target.value);

  const { createProductLoading, createProductRequest } = productStore();

  // Brands for the dropdown come from the database (/brand-list)
  const { brandList, brandListLoading, brandListRequest } = brandStore();
  useEffect(() => {
    brandListRequest();
  }, [brandListRequest]);

  // Categories for the dropdown come from the database (/category-list)
  const { categoryList, categoryListLoading, categoryListRequest } = categoryStore();
  useEffect(() => {
    categoryListRequest();
  }, [categoryListRequest]);

  const productSubmit = async () => {
    const error = validate(data);
    if (error) return ErrorToast(error);

    const res = await createProductRequest({
      title: data.title.trim(),
      short_description: data.short_description.trim(),
      images: data.images,
      price: Number(data.price),
      is_discount: data.is_discount,
      discount_price: data.is_discount ? Number(data.discount_price) : 0,
      category_id: data.category_id,
      brand_id: data.brand_id,
      remark: data.remark.trim(),
      stock: Number(data.stock),
      color: splitList(data.color),
      size: splitList(data.size),
      description: isEditorEmpty(data.description) ? "" : data.description,
    });

    if (res) {
      setData(EMPTY_PRODUCT);
      navigate("/all-product");
    }
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
                  <div className="row gy-4">
                    <div className="col-sm-6 col-xs-6">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Title *
                      </label>
                      <input
                        value={data.title}
                        onChange={onInput("title")}
                        type="text"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-sm-6 col-xs-6">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Short Description
                      </label>
                      <input
                        value={data.short_description}
                        onChange={onInput("short_description")}
                        type="text"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Images * (search and click to select multiple)
                      </label>
                      <ImagePicker value={data.images} onChange={set("images")} />
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Price *
                      </label>
                      <input
                        value={data.price}
                        onChange={onInput("price")}
                        type="number"
                        min="0"
                        step="any"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Is Discount?
                      </label>
                      <div className="select-has-icon">
                        <select
                          value={data.is_discount ? "true" : "false"}
                          onChange={(e) => {
                            const on = e.target.value === "true";
                            // Turning discount off clears the discount price
                            setData((prev) => ({
                              ...prev,
                              is_discount: on,
                              discount_price: on ? prev.discount_price : "",
                            }));
                          }}
                          className="common-input border"
                        >
                          <option value="false">False</option>
                          <option value="true">True</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Discount Price {data.is_discount && "*"}
                      </label>
                      <input
                        value={data.discount_price}
                        onChange={onInput("discount_price")}
                        disabled={!data.is_discount}
                        placeholder={data.is_discount ? "" : "Turn on discount first"}
                        type="number"
                        min="0"
                        step="any"
                        className="common-input border"
                      />
                    </div>

                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Category *
                      </label>
                      <div className="select-has-icon">
                        <select
                          value={data.category_id}
                          onChange={onInput("category_id")}
                          disabled={categoryListLoading && !categoryList}
                          className="common-input border"
                        >
                          <option value="">
                            {categoryListLoading && !categoryList
                              ? "Loading categories..."
                              : categoryList?.length === 0
                                ? "No categories found — create one first"
                                : "Please Select A Category **"}
                          </option>
                          {categoryList?.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.category_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Brand *
                      </label>
                      <div className="select-has-icon">
                        <select
                          value={data.brand_id}
                          onChange={onInput("brand_id")}
                          disabled={brandListLoading && !brandList}
                          className="common-input border"
                        >
                          <option value="">
                            {brandListLoading && !brandList
                              ? "Loading brands..."
                              : brandList?.length === 0
                                ? "No brands found — create one first"
                                : "Please Select A Brand **"}
                          </option>
                          {brandList?.map((brand) => (
                            <option key={brand._id} value={brand._id}>
                              {brand.brand_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Remark (Ex: New)
                      </label>
                      <input
                        value={data.remark}
                        onChange={onInput("remark")}
                        type="text"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Stock *
                      </label>
                      <input
                        value={data.stock}
                        onChange={onInput("stock")}
                        type="number"
                        min="0"
                        step="1"
                        className="common-input border"
                      />
                    </div>
                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Color (Ex: Red, Green, Blue)
                      </label>
                      <input
                        value={data.color}
                        onChange={onInput("color")}
                        type="text"
                        className="common-input border"
                      />
                    </div>

                    <div className="col-sm-4 col-xs-4">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Size (Ex: XXL, XL, X)
                      </label>
                      <input
                        value={data.size}
                        onChange={onInput("size")}
                        type="text"
                        className="common-input border"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label mb-2 font-18 font-heading fw-600">
                        Description
                      </label>

                      <ReactQuill
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        value={data.description}
                        onChange={set("description")}
                      />
                    </div>

                    <div className="col-sm-12 text-end">
                      <button
                        type="button"
                        onClick={productSubmit}
                        disabled={createProductLoading}
                        className="btn btn-main btn-lg pill mt-4"
                      >
                        {createProductLoading ? "Creating..." : "Create Product"}
                      </button>
                    </div>
                  </div>
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
