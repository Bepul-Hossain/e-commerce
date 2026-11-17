// Shared product form helpers (Create Product + Edit modal)

export const EMPTY_PRODUCT = {
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

// Product from the API -> form values (used by the Edit modal)
export const productToForm = (p) => ({
  title: p?.title || "",
  short_description: p?.short_description || "",
  images: Array.isArray(p?.images) ? p.images : [],
  price: p?.price ?? "",
  is_discount: !!p?.is_discount,
  discount_price: p?.is_discount ? (p?.discount_price ?? "") : "",
  category_id: p?.category_id || "",
  brand_id: p?.brand_id || "",
  remark: p?.remark || "",
  stock: p?.stock ?? "",
  color: Array.isArray(p?.color) ? p.color.join(", ") : "",
  size: Array.isArray(p?.size) ? p.size.join(", ") : "",
  description: p?.description || "",
});

// "Red, Green ,, Blue" -> ["Red", "Green", "Blue"]
const splitList = (text) =>
  String(text).split(",").map((s) => s.trim()).filter(Boolean);

// Quill leaves "<p><br></p>" when the editor is visually empty
const isEditorEmpty = (html) =>
  String(html).replace(/<(.|\n)*?>/g, "").trim().length === 0;

// Same rules as the API, so most mistakes are caught before the request
export const validate = (d) => {
  if (!String(d.title).trim()) return "Title is required!";
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

// Form values -> request body for create/update
export const toPayload = (d) => ({
  title: String(d.title).trim(),
  short_description: String(d.short_description).trim(),
  images: d.images,
  price: Number(d.price),
  is_discount: d.is_discount,
  discount_price: d.is_discount ? Number(d.discount_price) : 0,
  category_id: d.category_id,
  brand_id: d.brand_id,
  remark: String(d.remark).trim(),
  stock: Number(d.stock),
  color: splitList(d.color),
  size: splitList(d.size),
  description: isEditorEmpty(d.description) ? "" : d.description,
});
