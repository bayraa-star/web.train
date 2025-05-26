import { useContext, createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RiCloseFill } from "react-icons/ri";
import { GetFromStorage, RemoveFromStorage, SaveToStorage } from "./storage";

import { locales } from "../language/Switch";

window.addEventListener("storage", (event) => {
  if (event.key === "logged-out") {
    window.location = "/auth/logout";
    window.close();
  }
});

const AppContext = createContext({
  user: null,
  badge: 0,
  login: () => {},
  logout: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
});

const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState();
  const [drawer, setDrawer] = useState();
  const [drawerWidth, setDrawerWidth] = useState(0);

  const login = async (instance) => {
    setInstance(instance.user, instance.token);
    navigate("/app/user");
  };

  const logout = () => {
    setInstance(null, null);
  };

  const setInstance = (user, token) => {
    if (user) {
      SaveToStorage("user", JSON.stringify(user));
      SaveToStorage("token", token);
      setUser(user);
    } else {
      RemoveFromStorage("user");
      RemoveFromStorage("token");
      setUser(null);
    }
  };

  const openDrawer = (content, width = 250) => {
    setDrawer(content);
    setDrawerWidth(width);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setDrawerWidth(0);
  };

  useEffect(() => {
    (async () => {
      const user = GetFromStorage("user");
      const token = GetFromStorage("token");
      token && setInstance(JSON.parse(user), token);
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{ user, login, logout, openDrawer, closeDrawer }}
    >
      {drawer && (
        <div
          className="fixed top-0 left-0 bottom-0 right-0 z-30 flex overflow-y-auto"
          onClick={closeDrawer}
        >
          <div
            style={{ width: drawerWidth }}
            className="flex-grow-0 bg-white shadow-md z-50 transition-all relative"
          >
            <div className="absolute top-0 right-0 icon-button text-dark-60">
              <RiCloseFill />
            </div>
            <img src="/logo.png" className="h-10 my-5 mx-auto" alt="logo" />
            <div className="text-secondary-100 text-center pb-5 border-b"></div>
            {drawer}
          </div>
          <div className="flex-1 bg-black bg-opacity-80 z-40"></div>
        </div>
      )}

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppProvider;
