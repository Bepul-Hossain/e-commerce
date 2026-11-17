import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../helper/helper";
import userStore from "../store/userStore";
const PrivateRoute = ({ children }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const location = useLocation();

  let { userVerifyRequest, userRequest } = userStore();
  useEffect(() => {
    (async () => {
      try {
        // No cookie: go straight to /login without hitting the API
        if (!getToken()) {
          setIsLogin(false);
          return;
        }
        const verified = await userVerifyRequest();
        if (verified) {
          await userRequest();
        }
        setIsLogin(verified);
      } catch (error) {
        console.log(error);

        setIsLogin(false);
      } finally {
        setLoading(false); // Set loading to false after verification
      }
    })();
  }, [userVerifyRequest, userRequest]);

  if (loading) {
    return <></>;
  }

  // replace: the protected URL is swapped for /login instead of stacking on it,
  // so Back goes to the page before it (no redirect loop). `from` lets Login
  // send the user back here after signing in.
  return isLogin ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
};

export default PrivateRoute;
