import { NavLink, Outlet, useLocation } from "react-router-dom";
import { RiMenuFill } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { useApp } from "../providers/app";
import { useEffect } from "react";
const PublicMenu = () => {
  const { t } = useTranslation();
  const { user, openDrawer } = useApp();
  const location = useLocation();
  const { pathname } = location;

  const openMobileMenu = () => {
    openDrawer(
      <div className="flex flex-col">
        <NavLink
          key={0}
          to={"/seal/home"}
          className={({ isActive }) =>
            `${
              isActive ? "text-secondary-100" : "text-dark-40"
            } pointer block w-full border-b p-2`
          }
        >
          {t("public.menu.home")}
        </NavLink>
        <NavLink
          key={1}
          to={"seal/product"}
          className={({ isActive }) =>
            `${
              isActive ? "text-secondary-100" : "text-dark-40"
            } pointer block w-full border-b p-2`
          }
        >
          {t("public.menu.product")}
        </NavLink>
        <NavLink
          key={2}
          to={"seal/about"}
          className={({ isActive }) =>
            `${
              isActive ? "text-secondary-100" : "text-dark-40"
            } pointer block w-full border-b p-2`
          }
        >
          {t("public.menu.about")}
        </NavLink>
        <NavLink
          key={2}
          to={"seal/contact"}
          className={({ isActive }) =>
            `${
              isActive ? "text-secondary-100" : "text-dark-40"
            } pointer block w-full border-b p-2`
          }
        >
          {t("public.menu.contact")}
        </NavLink>
      </div>
    );
  };
  return (
    <div className={`bg-white shadow flex z-0`}>
      <div className="mx-auto w-full md:w-10/12 lg:w-10/12 sm:w-full ">
        <div className="flex flex-row items-center justify-between p-4">
          <img
            src="/logo.png"
            alt="logo"
            className="h-10"
            style={{ height: 49 }}
          />
          <div className="flex flex-row justify-end">
            <div
              className="lg:flex md:flex hidden justify-end"
              style={{ width: "588px" }}
            >
              <NavLink
                className={`text-base font-semibold mx-4  ${
                  pathname == "/seal/home" ? "text-active" : "text-menutext"
                }`}
                to={"home"}
              >
                <div className=" text-base leading-4 font-bold mt-1">
                  {t("public.menu.home")}
                </div>
              </NavLink>
              <NavLink
                className={`text-base font-semibold mx-4 ${
                  pathname == "/seal/product" ? "text-active" : "text-menutext"
                }`}
                to={"product"}
              >
                <div className=" text-base leading-4 font-bold mt-1">
                  {t("public.menu.product")}
                </div>
              </NavLink>
              <NavLink
                className={`text-base font-semibold mx-4 ${
                  pathname == "/seal/about" ? "text-active" : "text-menutext"
                }`}
                to={"about"}
              >
                <div className=" text-base leading-4 font-bold mt-1">
                  {t("public.menu.about")}
                </div>
              </NavLink>
              <NavLink
                className={`text-base font-semibold mx-4 ${
                  pathname == "/seal/contact" ? "text-active" : "text-menutext"
                }`}
                to={"contact"}
              >
                <div className=" text-base leading-4 font-bold mt-1">
                  {t("public.menu.contact")}
                </div>
              </NavLink>
            </div>
            <div
              className="lg:hidden md:hidden icon-button border border-dark-60 text-dark-60"
              onClick={openMobileMenu}
            >
              <RiMenuFill />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PublicFooter = () => {
  const { t } = useTranslation();

  return (
    <div className="border-t bg-menu">
      <div className="flex justify-center items-center p-6 text-center text-sm">
        <div className="text-sm font-normal">{`©2023 ${t("company")}`}</div>
      </div>
    </div>
  );
};

const PublicLayout = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  return (
    <div className="w-full flex flex-col justify-center bg-background">
      {/* <PublicMenu /> */}
      <div className="mx-auto w-full md:w-10/12 lg:w-10/12 sm:w-full bg-background">
        <Outlet />
        {/* <PublicFooter /> */}
      </div>
    </div>
  );
};

export default PublicLayout;
