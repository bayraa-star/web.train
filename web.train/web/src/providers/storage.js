import Cookies from "js-cookie";

export const SaveToStorage = (key, data) => {
    if (key && data) Cookies.set(key, data);
};

export const GetFromStorage = (key) => {
    if (key) return Cookies.get(key);
};

export const RemoveFromStorage = (key) => {
    if (key) Cookies.remove(key);
};
