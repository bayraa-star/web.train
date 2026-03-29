import React, { Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import "./index.css";
import "./providers/i18n";

import AppProvider from "./providers/app";
import Loader from "./pages/Loader";
import Login from "./pages/Login";
import axios from "axios";
import { API_ROOT } from "./defines";
import "react-tabs/style/react-tabs.css";
import Home from "./pages/Home";
import { useApp } from "./providers/app";

axios.defaults.baseURL = API_ROOT;
document.addEventListener("wheel", function () {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
});

const RequireAuth = () => {
  const { user, ready } = useApp();

  if (!ready) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

const LoginRoute = () => {
  const { user, ready } = useApp();

  if (!ready) return <Loader />;
  if (user) return <Navigate to="/home" replace />;

  return <Login />;
};

const LogoutRoute = () => {
  const { logout, ready } = useApp();

  useEffect(() => {
    if (ready) {
      logout("/login");
    }
  }, [ready, logout]);

  return <Loader />;
};

const RootRedirect = () => {
  const { user, ready } = useApp();

  if (!ready) return <Loader />;

  return <Navigate to={user ? "/home" : "/login"} replace />;
};

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <React.StrictMode>
      <Suspense fallback={<Loader />}>
        <AppProvider>
          <div className="h-full w-full flex">
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/logout" element={<LogoutRoute />} />
              <Route element={<RequireAuth />}>
                <Route path="/home/*" element={<Home />} />
              </Route>
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </div>
        </AppProvider>
      </Suspense>
    </React.StrictMode>
  </BrowserRouter>
);
