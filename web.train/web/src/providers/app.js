import { useContext, createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiCloseFill } from "react-icons/ri";
import { GetFromStorage, RemoveFromStorage, SaveToStorage } from "./storage";

const AppContext = createContext({
  user: null,
  ready: false,
  login: () => {},
  logout: () => {},
  openDrawer: () => {},
  closeDrawer: () => {},
});

const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decoded = window.atob(padded);

    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const isExpiredToken = (token) => {
  const payload = parseJwt(token);

  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState();
  const [drawerWidth, setDrawerWidth] = useState(0);

  const clearSession = () => {
    RemoveFromStorage("user");
    RemoveFromStorage("token");
    setUser(null);
  };

  const setInstance = (nextUser, token) => {
    if (nextUser && token && !isExpiredToken(token)) {
      SaveToStorage("user", JSON.stringify(nextUser));
      SaveToStorage("token", token);
      setUser(nextUser);
      return;
    }

    clearSession();
  };

  const login = async (instance) => {
    setInstance(instance.user, instance.token);
    navigate("/home", { replace: true });
  };

  const logout = (redirect = "/login") => {
    clearSession();

    if (redirect) {
      navigate(redirect, { replace: true });
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
    try {
      const user = GetFromStorage("user");
      const token = GetFromStorage("token");

      if (user && token && !isExpiredToken(token)) {
        setUser(JSON.parse(user));
      } else {
        clearSession();
      }
    } catch (error) {
      clearSession();
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ user, ready, login, logout, openDrawer, closeDrawer }}
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
