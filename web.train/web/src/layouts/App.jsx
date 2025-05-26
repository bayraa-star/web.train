import { NavLink, Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MENU from "./menu";
import { useApp } from "../providers/app";
import Loader from "../pages/Loader";
import { useState } from "react";
import { ArrowLeft2, ArrowRight2, LogoutCurve } from "iconsax-react";

const checker = (arr, val) => {
  const temp = arr?.filter((row) => row == val);

  return temp?.length > 0 ? true : false;
};
const AppMenu = ({ role, firstname, lastname, permissions }) => {
  const { t } = useTranslation();
  const [open, setopen] = useState(true);

  return (
    <div className="flex">
      <div
        style={{ width: open ? 300 : 100 }}
        className="flex flex-col  bg-white p-5 h-full"
      >
        <img
          src="/police.png"
          style={{ width: 80 }}
          className="mx-auto object-cover mt-4"
          alt="logo"
        />

        {/* {open && (
          <div className="text-center mt-5">
            <h2>
              <span className="uppercase font-bold">
                {lastname?.substring(0, 1) + ". " + firstname}
              </span>
            </h2>
            <div className="text-center fond-semibold">
              <Version />
            </div>
          </div>
        )} */}
        <div className="flex flex-col mt-10">
          {MENU.map(({ label, path, icon, name }) => {
            return checker(permissions, name) ? (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `${
                    isActive
                      ? "bg-odt-primary text-white rounded-2xl"
                      : "text-dark-40 "
                  } p-3 w-full flex items-centerx ${!open && ` justify-center`}`
                }
              >
                <div className="mx-2">{icon}</div>
                {open && <div>{label}</div>}
              </NavLink>
            ) : (
              <div />
            );
          })}
          <div className="flex relative w-full mt-4">
            <Link
              to="/auth/logout"
              className="text-primary-100 p-2 w-full flex items-center mt-8"
            >
              <div className="mr-2">
                <LogoutCurve size={25} />
              </div>
              {open && t("menu.logout")}
            </Link>
            <div className="items-end justify-end absolute bottom-0 -right-8 bg-white  rounded-full shadow">
              <div
                className="hover:cursor-pointer flex w-full"
                onClick={() => setopen(!open)}
              >
                {open ? (
                  <div className="p-2 w-full flex items-center justify-end text-odt-primary ">
                    <ArrowLeft2 size={25} />
                  </div>
                ) : (
                  <div className="p-2 w-full flex items-center text-odt-primary ">
                    <ArrowRight2 size={25} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppLayout = () => {
  const { user } = useApp();

  if (!user) return <Loader />;

  return (
    <div className="w-full flex">
      <AppMenu {...user}></AppMenu>
      <div className="flex-1 overflow-scroll ">
        <Outlet></Outlet>
      </div>
    </div>
  );
};

export default AppLayout;
