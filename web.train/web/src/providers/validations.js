import * as yup from "yup";

export const emailValidation = (required) => {
	const def = yup.string().email("valid");

	if (required) return def.required("required");
	return def;
};

export const phoneValidation = (required) => {
	const def = yup.string().min(8, "min_8").max(20, "max_20");

	if (required) return def.required("required");
	return def;
};

export const passwordValidation = (required) => {
	const def = yup.string().min(6, "min_6");

	if (required) return def.required("required");
	return def;
};

export const stringValidation = (required, length = 500) => {
	const def = yup.string().max(length, `max_${length}`);

	if (required) return def.required("required");
	return def;
};

export const selectValidation = (required) => {
	const def = yup.string().max(250, "max_250").nullable();

	if (required) return def.required("required");
	return def;
};

export const numberValidation = (required, { min, max } = {}) => {
	let def = yup.number();

	if (min) def = def.min(min, `min_${min}`);
	if (max) def = def.max(max, `min_${max}`);

	if (required) return def.required("required");
	return def;
};

export const booleanValidation = (required) => {
	const def = yup.boolean();

	if (required) return def.oneOf([true], "required");
	return def;
};

export const fileValidation = (required) => {
	const def = yup.array();

	if (required) return def.min(1, "required");
	return def;
};

export const coordinateValidation = (required) => {
	const def = yup.object().nullable();

	if (required) return def.required("required");
	return def;
};

export const arrayValidation = (required) => {
	const def = yup.array();

	if (required) return def.min(1, "required");
	return def;
};
