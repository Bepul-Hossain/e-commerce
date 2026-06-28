import axios from "axios";
import { create } from "zustand";
import { baseURL } from "../helper/config";
import { ErrorToast, SuccessToast } from "../helper/helper";

const userStore = create((set) => ({
    // user register
    userRegisterLoading: false,
    userRegisterRequest: async (data) => {
        try {
            set({ userRegisterLoading: true })
            let res = await axios.post(baseURL + "/user-register", data, {
                withCredentials: true,
                creadedentials: "include",
            });

            if (res?.data?.success === true) {
                set({ userRegisterLoading: false })
                SuccessToast(res?.data?.message);
                return true;
            } else {
                set({ userRegisterLoading: false })
                ErrorToast(res?.data?.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            set({ userRegisterLoading: false })
            ErrorToast(error?.response?.data?.message);
            return false;
        }
    },
    // user login
    userLoginLoading: false,
    userLoginRequest: async (data) => {
        try {
            set({ userLoginLoading: true })
            let res = await axios.post(baseURL + "/user-login", data, {
                withCredentials: true,
                creadedentials: "include",
            });

            if (res?.data?.success === true) {
                set({ userLoginLoading: false })
                SuccessToast(res?.data?.message);
                return true;
            } else {
                set({ userLoginLoading: false })
                ErrorToast(res?.data?.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            set({ userLoginLoading: false })
            ErrorToast(error?.response?.data?.message);
            return false;
        }
    },
    // user
    user: null,
    userRequest: async () => {
        try {
            let res = await axios.get(baseURL + "/user", {
                withCredentials: true,
                credentials: "include",
            })
            if (res?.data?.success === true) {
                set({ user: res?.data?.data })
                return true
            }
        } catch (error) {
            console.log(error);
            ErrorToast("Something went wrong.");
            return false
        }
    },
    // user-verify
    userVerifyRequest: async () => {
        try {
            await axios.get(baseURL + "/user-verify", {
                withCredentials: true,
                credentials: "include",
            })
            return true
        } catch (error) {
            console.log(error);
            if (error?.status === 401) {
                window.location.href = "/login";
            }
            ErrorToast("Something went wrong.");
            return false
        }
    },

    // user-update
    userUpdateLoading: false,
    userUpdateRequest: async (data) => {
        try {
            set({ userUpdateLoading: true })
            let res = await axios.put(baseURL + "/user-update", data, {
                withCredentials: true,
                creadedentials: "include",
            });
            if (res?.data?.success === true) {
                set({ userUpdateLoading: false })
                SuccessToast(res?.data?.message);
                return true
            } else {
                set({ userUpdateLoading: false })
                ErrorToast(res?.data?.message);
                return false
            }
        } catch (error) {
            console.log(error);
            set({ userUpdateLoading: false })
            ErrorToast("Something went wrong.");
            return false;
        }
    },
    // user-logout
    userLogoutRequest: async () => {
        try {
            let res = await axios.get(baseURL + "/user-logout", {
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

}));

export default userStore