import axios from "axios";
import { create } from "zustand";
import { baseURL } from "../helper/config";
import { ErrorToast, SuccessToast } from "../helper/helper";

const adminStore = create((set) => ({
    // admin register
    adminRegisterLoading: false,
    adminRegisterRequest: async (data) => {
        try {
            set({ adminRegisterLoading: true })
            let res = await axios.post(baseURL, data, {
                withCredentials: true,
                creadedentials: "include",
            });

            if (res?.data?.success === true) {
                set({ adminRegisterLoading: false })
                SuccessToast(res?.data?.message);
                return true;
            } else {
                set({ adminRegisterLoading: false })
                ErrorToast(res?.data?.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            set({ adminRegisterLoading: false })
            ErrorToast(error?.response?.data?.message);
            return false;
        }
    },
    // admin login
    adminLoginLoading: false,
    adminLoginRequest: async (data) => {
        try {
            set({ adminLoginLoading: true })
            let res = await axios.post(baseURL + "/admin-login", data, {
                withCredentials: true,
                creadedentials: "include",
            });

            if (res?.data?.success === true) {
                set({ adminLoginLoading: false })
                SuccessToast(res?.data?.message);
                return true;
            } else {
                set({ adminLoginLoading: false })
                ErrorToast(res?.data?.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            set({ adminLoginLoading: false })
            ErrorToast(error?.response?.data?.message);
            return false;
        }
    },
    // admin verify
    adminVerifyRequest: async () => {
        try {
            await axios.get(baseURL + "/admin-verify", {
                withCredentials: true,
                creadedentials: "include",
            });
            return true;
        } catch (error) {
            if (error?.response?.status === 401) {
                window.location.href = "/super-admin/login";
            }
            ErrorToast("Something went wrong.");
            return false;
        }
    },
    // admin get
    admin: null,
    adminRequest: async () => {
        try {
            let res = await axios.get(baseURL + "/admin", {
                withCredentials: true,
                creadedentials: "include",
            });
            if (res?.data?.success === true) {
                set({ admin: res?.data?.data });
                return true
            }
        } catch (error) {
            console.log(error);
            ErrorToast("Something went wrong.");
            return false;
        }
    },
    // admin update
    adminUpdateLoading: false,
    adminUpdateRequest: async (data) => {
        try {
            set({ adminUpdateLoading: true })
            let res = await axios.put(baseURL + "/admin-update", data, {
                withCredentials: true,
                creadedentials: "include",
            });
            if (res?.data?.success === true) {
                set({ adminUpdateLoading: false })
                SuccessToast(res?.data?.message);
                return true
            } else {
                set({ adminUpdateLoading: false })
                ErrorToast(res?.data?.message);
                return false
            }
        } catch (error) {
            console.log(error);
            set({ adminUpdateLoading: false })
            ErrorToast("Something went wrong.");
            return false;
        }
    },
    // admin logout
    adminLogoutRequest: async () => {
        try {
            let res = await axios.get(baseURL + "/admin-logout", {
                withCredentials: true,
                creadedentials: "include",
            });
            if (res?.data?.success === true) {
                return true
            } else {
                return false
            }
        } catch (error) {
            console.log(error);
            ErrorToast("Something went wrong.");
            return false;
        }
    },
}))

export default adminStore