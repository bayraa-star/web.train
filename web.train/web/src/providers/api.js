import axios from "axios";
import { GetFromStorage, RemoveFromStorage } from "./storage";
import { API_ROOT } from "../defines";

const mainApi = axios.create({
  baseURL: API_ROOT,
});

mainApi.interceptors.request.use((request) => {
  const token = GetFromStorage("token");

  const language = GetFromStorage("i18next");

  if (token) request.headers["Authorization"] = `Bearer ${token}`;
  if (language) request.headers["Accept-Language"] = language;

  return request;
});

mainApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const clearSessionAndRedirect = () => {
      RemoveFromStorage("user");
      RemoveFromStorage("token");

      if (window.location.pathname !== "/login") {
        window.location = "/login";
      }
    };

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }
    if (error?.response?.status === 400) {
      if (typeof error?.response?.data === "string")
        return Promise.reject(error.response.data);

      return Promise.reject(
        error?.response?.data?.message,
        error?.response?.data?.payload
      );
    }
    if (error?.response?.status === 404) {
      return Promise.reject("Мэдээлэл олдсонгүй");
    }
    if (error.message === "Network Error") {
      return Promise.reject("Сүлжээний алдаа");
    }

    return Promise.reject(
      error?.response?.data?.message ?? error.message ?? error.toString()
    );
  }
);

export { mainApi };
