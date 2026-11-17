import axios from "axios";
import { create } from "zustand";
import { baseURL } from "../helper/config";
import { ErrorToast, SuccessToast } from "../helper/helper";

const productStore = create((set) => ({
    // create product
    createProductLoading: false,
    createProductRequest: async (data) => {
        try {
            set({ createProductLoading: true })
            // 2nd argument is the request body, 3rd is the axios config
            let res = await axios.post(baseURL + "/create-product", data, {
                withCredentials: true,
            })
            if (res?.data?.success === true) {
                set({ createProductLoading: false })
                SuccessToast(res?.data?.message);
                return true
            } else {
                set({ createProductLoading: false })
                ErrorToast(res?.data?.message);
                return false
            }
        } catch (error) {
            console.log(error);
            // Show the server's validation message (e.g. "Title is required.")
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            set({ createProductLoading: false })
            return false
        }
    },
    // all products
    totalProducts: null,
    allProducts: null,
    // Empty filters are sent as 0 (the API treats "0" as "not set")
    allProductsRequest: async (category_id, brand_id, remark, keyword, per_page, page_no) => {
        try {
            const seg = (v) => encodeURIComponent(v === "" || v == null ? 0 : v);
            let res = await axios.get(baseURL +
                `/all-products/${seg(category_id)}/${seg(brand_id)}/${seg(remark)}/${seg(keyword)}/${per_page}/${page_no}`,
                {
                    withCredentials: true,
                }
            )
            if (res?.data?.success === true) {
                set({
                    allProducts: res?.data?.data?.products || [],
                    totalProducts: res?.data?.data?.totalCount?.[0]?.count || 0,
                })
                return true
            }
        } catch (error) {
            console.log(error);
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            return false
        }
    },
    // all new arrival products
    allNewArrivalProducts: null,
    allNewArrivalProductsRequest: async () => {
        try {
            let res = await axios.get(baseURL + `/all-products/0/0/8/1`, {
                withCredentials: true,
                credentials: "include",
            })
            if (res?.data?.success === true) {
                set({ allNewArrivalProducts: res?.data?.data?.products, })
                return true
            }
        } catch (error) {
            console.log(error);
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            return false
        }
    },
    // single product
    singleProduct: null,
    singleProductRequest: async (id) => {
        try {
            let res = await axios.get(baseURL + `/single-product/${id}`, {
                withCredentials: true,
                credentials: "include",
            })
            if (res?.data?.success === true) {
                set({ singleProduct: res?.data?.data?.[0] })
                return res?.data?.data?.[0]
            }
        } catch (error) {
            console.log(error);
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            return false
        }
    },
    // delete product
    deleteProductRequest: async (id) => {
        try {
            let res = await axios.delete(baseURL + `/delete-product/${id}`, {
                withCredentials: true,
                credentials: "include",
            })
            if (res?.data?.success === true) {
                SuccessToast(res?.data?.message);
                return true
            } else {
                ErrorToast(res?.data?.message);
                return false
            }
        } catch (error) {
            console.log(error);
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            return false
        }
    },
    // update product
    updateProductRequest: async (id, data) => {
        try {
            let res = await axios.put(baseURL + `/update-product/${id}`, data, {
                withCredentials: true,
                credentials: "include",
            })
            if (res?.data?.success === true) {
                SuccessToast(res?.data?.message);
                return true
            } else {
                ErrorToast(res?.data?.message);
                return false
            }
        } catch (error) {
            console.log(error);
            ErrorToast(error?.response?.data?.message || "Something went wrong.");
            return false
        }
    }
}))

export default productStore;