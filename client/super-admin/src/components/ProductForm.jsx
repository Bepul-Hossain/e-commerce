import ReactQuill from "react-quill-new";
import { useEffect, useState } from "react";
import { ErrorToast, formats, modules } from "../helper/helper";
import {
  COLOR_OPTIONS,
  EMPTY_PRODUCT,
  SIZE_OPTIONS,
  toPayload,
  validate,
} from "../helper/productForm";
import ImagePicker from "./ImagePicker";
import MultiSelectDropdown from "./MultiSelectDropdown";
import brandStore from "../store/brandStore";
import categoryStore from "../store/categoryStore";

/**
 * Product fields + validation, shared by Create Product and the Edit modal.
 *
 * Props:
 *  - initialValues: form values to start with (default: empty form)
 *  - onSubmit:      async (payload) => boolean; true = saved
 *  - loading:       disables the submit button while saving
 *  - submitLabel / loadingLabel: button text
 *  - resetOnSuccess: clear the form after a successful submit
 *  - onCancel:      if given, shows a Cancel button
 */
const ProductForm = ({
  initialValues = EMPTY_PRODUCT,
  onSubmit,
  loading = false,
  submitLabel = "Save",
  loadingLabel = "Saving...",
  resetOnSuccess = false,
  onCancel,
}) => {
  const [data, setData] = useState(initialValues);

  // Update one field: set("title")("New title")
  const set = (field) => (value) => setData((prev) => ({ ...prev, [field]: value }));
  // For plain inputs/selects: onChange={onInput("title")}
  const onInput = (field) => (e) => set(field)(e.target.value);

  // Brand and category dropdowns come from the database
  const { brandList, brandListLoading, brandListRequest } = brandStore();
  const { categoryList, categoryListLoading, categoryListRequest } = categoryStore();
  useEffect(() => {
    brandListRequest();
    categoryListRequest();
  }, [brandListRequest, categoryListRequest]);

  const handleSubmit = async () => {
    const error = validate(data);
    if (error) return ErrorToast(error);
    const ok = await onSubmit(toPayload(data));
    if (ok && resetOnSuccess) setData(EMPTY_PRODUCT);
  };

  return (
    <div className="row gy-4">
      <div className="col-sm-6 col-xs-6">
        <label className="form-label mb-2 font-18 font-heading fw-600">Title *</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Price *</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Is Discount?</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Category *</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Brand *</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Stock *</label>
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
        <label className="form-label mb-2 font-18 font-heading fw-600">Color</label>
        <MultiSelectDropdown
          options={COLOR_OPTIONS}
          value={data.color}
          onChange={set("color")}
          placeholder="Select colors"
          swatch
        />
      </div>
      <div className="col-sm-4 col-xs-4">
        <label className="form-label mb-2 font-18 font-heading fw-600">Size</label>
        <MultiSelectDropdown
          options={SIZE_OPTIONS}
          value={data.size}
          onChange={set("size")}
          placeholder="Select sizes"
        />
      </div>

      <div className="col-12">
        <label className="form-label mb-2 font-18 font-heading fw-600">Description</label>
        <ReactQuill
          theme="snow"
          modules={modules}
          formats={formats}
          value={data.description}
          onChange={set("description")}
        />
      </div>

      <div className="col-sm-12 d-flex justify-content-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-secondary btn-lg pill mt-4"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-main btn-lg pill mt-4"
        >
          {loading ? loadingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
};

export default ProductForm;
