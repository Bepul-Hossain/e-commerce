import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import userStore from "../store/userStore";
import { ErrorToast, IsEmpty } from "../helper/helper";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { useState } from "react";

const Login = () => {
  let { userLoginLoading, userLoginRequest } = userStore();
  let navigate = useNavigate();
  let location = useLocation();
  let [searchParams] = useSearchParams();
  // Page the user was sent here from: router state (in-app redirects) or
  // ?redirect= (full-page redirects). Only allow same-site paths.
  let from = location.state?.from || searchParams.get("redirect");
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/login")) {
    from = "/dashboard-profile";
  }
  let [data, setData] = useState({ email: "", password: "" });
  let [showPassword, setShowPassword] = useState(false);
  // validation rules
  const validations = [
    { field: data.email, message: "Email is required!" },
    { field: data.password, message: "Password is required!" },
  ];
  let userSubmit = async () => {
    for (const { field, message } of validations) {
      if (IsEmpty(field)) {
        return ErrorToast(message);
      }
    }
    let res = await userLoginRequest(data);
    if (res) {
      // replace: so Back from the returned page doesn't land on /login again
      navigate(from, { replace: true });
    }
  };
  return (
    <>
      {/* ================================== Account Page Start =========================== */}
      <section className="account d-flex">
        <img
          src="assets/images/thumbs/account-img.png"
          alt=""
          className="account__img"
        />
        <div className="account__left d-md-flex d-none flx-align section-bg position-relative z-index-1 overflow-hidden">
          <img
            src="assets/images/shapes/pattern-curve-seven.png"
            alt=""
            className="position-absolute end-0 top-0 z-index--1 h-100"
          />
          <div className="account-thumb">
            <img src="assets/images/thumbs/banner-img.png" alt="" />
            <div className="statistics animation bg-main text-center">
              <h5 className="statistics__amount text-white">50k</h5>
              <span className="statistics__text text-white font-14">
                Customers
              </span>
            </div>
          </div>
        </div>
        <div className="account__right padding-y-120 flx-align">
          <div className="dark-light-mode">
            {/* Light Dark Mode */}
            <ThemeToggle />
          </div>
          <div className="account-content">
            <Link to="/" className="logo mb-64">
              <img
                src="assets/images/logo/logo.png"
                alt=""
                className="white-version"
              />
              <img
                src="assets/images/logo/white-logo-two.png"
                alt=""
                className="dark-version"
              />
            </Link>
            <h4 className="account-content__title mb-48 text-capitalize">
              Welcome Back! Please Sign In
            </h4>
            <div>
              <div className="row gy-4">
                <div className="col-12">
                  <label
                    htmlFor="email"
                    className="form-label mb-2 font-18 font-heading fw-600"
                  >
                    Email
                  </label>
                  <div className="position-relative">
                    <input
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      required
                      type="email"
                      className="common-input common-input--bg common-input--withIcon"
                      id="email"
                      placeholder="infoname@mail.com"
                    />
                    <span className="input-icon">
                      <img src="assets/images/icons/envelope-icon.svg" alt="" />
                    </span>
                  </div>
                </div>
                <div className="col-12">
                  <label
                    htmlFor="your-password"
                    className="form-label mb-2 font-18 font-heading fw-600"
                  >
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      onChange={(e) => setData({ ...data, password: e.target.value })}
                      required
                      type={showPassword ? "text" : "password"}
                      className="common-input common-input--bg common-input--withIcon"
                      id="your-password"
                      placeholder="6+ characters, 1 Capital letter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="input-icon toggle-password cursor-pointer border-0 bg-transparent p-0"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="col-12">
                  <button onClick={userSubmit} disabled={userLoginLoading} className="btn btn-main btn-lg w-100 pill">
                    {userLoginLoading ? "Loading..." : "Sign In"}
                  </button>
                </div>

                <div className="col-sm-12 mb-0">
                  <div className="have-account">
                    <p className="text font-14">
                      New to the market?{" "}
                      <Link
                        className="link text-main text-decoration-underline fw-500"
                        to="/register"
                      >
                        sign up
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ================================== Account Page End =========================== */}
    </>
  );
};

export default Login;
