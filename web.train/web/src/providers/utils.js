import objectPath from "object-path";
import { API_ROOT } from "../defines";

export const timeOut = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getRandom = (max = 50, min = 1) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const getImageSrc = (field, placeholder = "/images/profile.png") => {
	const src = objectPath.get(field, "0.id");

	return src ? `${API_ROOT + "/" + src}` : placeholder;
};
