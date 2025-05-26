import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import "./providers/i18n";

import AppProvider from "./providers/app";
import Loader from "./pages/Loader";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AppLayout from "./layouts/App";
import PublicLayout from "./layouts/Public";
import AuthLayout from "./layouts/Auth";
import axios from "axios";
import { API_ROOT } from "./defines";
import "react-tabs/style/react-tabs.css";
// User
import UserList from "./user/List";
import UserForm from "./user/Form";
import Log from "./log";
import LogDetail from "./log/detail";
import Home from "./pages/Home";

axios.defaults.baseURL = API_ROOT;
document.addEventListener("wheel", function () {
  if (document.activeElement.type === "number") {
    document.activeElement.blur();
  }
});

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <React.StrictMode>
      <Suspense fallback={<Loader />}>
        <AppProvider>
          <div className="h-full w-full flex">
            <Routes>
              <Route path="*" element={<Navigate to="/home" />} />
              <Route path="home" element={<Home />} />
            </Routes>
          </div>
        </AppProvider>
      </Suspense>
    </React.StrictMode>
  </BrowserRouter>
);
