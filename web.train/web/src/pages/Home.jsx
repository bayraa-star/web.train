import React, { useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "../providers/app";
import UploadSection from "./components/UploadSection";
import LabelingSection from "./components/LabelingSection";
import ExaminerSection from "./components/ExaminerSection";
import AdminProgressSection from "./components/AdminProgressSection";
import UserCreateSection from "./components/UserCreateSection";
import UserManagementSection from "./components/UserManagementSection";
import JobManagementSection from "./components/JobManagementSection";

const Home = () => {
  const { user, logout } = useApp();
  const [queueReset, setQueueReset] = useState(false);

  const adminMenuItems = [
    {
      label: "Dashboard",
      to: "/home/dashboard",
    },
    {
      label: "Users",
      to: "/home/users",
    },
    {
      label: "Uploads & Jobs",
      to: "/home/uploads",
    },
  ];

  const triggerRefresh = () => {
    setQueueReset((prev) => !prev);
  };

  return (
    <div className="flex flex-col p-8 w-full">
      <div className="flex w-full justify-between items-center">
        <div>
          <div className="font-medium">Labeling Workspace</div>
          <div className="text-sm text-gray-500">
            {user?.username} ({user?.role})
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout("/login")}
          className="!w-auto shrink-0 border px-4 py-2 rounded inline-flex"
        >
          Logout
        </button>
      </div>

      {user?.role === "admin" && (
        <>
          <div className="mt-8 flex flex-wrap gap-3">
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `!w-auto border px-4 py-2 rounded inline-flex ${
                    isActive ? "bg-black text-white" : "bg-white text-black"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route
              path="dashboard"
              element={<AdminProgressSection refreshKey={queueReset} />}
            />
            <Route
              path="users"
              element={
                <>
                  <UserCreateSection onCreated={triggerRefresh} />
                  <UserManagementSection
                    refreshKey={queueReset}
                    onChanged={triggerRefresh}
                  />
                </>
              }
            />
            <Route
              path="uploads"
              element={
                <>
                  <UploadSection
                    refreshKey={queueReset}
                    onUploaded={triggerRefresh}
                  />
                  <JobManagementSection
                    refreshKey={queueReset}
                    onChanged={triggerRefresh}
                  />
                </>
              }
            />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </>
      )}

      {user?.role === "labeler" && (
        <LabelingSection refreshKey={queueReset} />
      )}

      {user?.role === "examiner" && (
        <ExaminerSection refreshKey={queueReset} />
      )}
    </div>
  );
};

export default Home;
