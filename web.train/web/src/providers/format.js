import { Link } from "react-router-dom";
import objectPath from "object-path";
import { API_ROOT, DATE_FORMAT } from "../defines";
import { format } from "date-fns";
import { HiLink, HiArrowSmRight } from "react-icons/hi";
import { t } from "i18next";

export const formatString = (object, path) => {
	return objectPath.get(object, path);
};

export const formatDate = (object, path, form) => {
	const date = objectPath.get(object, path);

	if (date) return format(new Date(date), form || DATE_FORMAT);
};

export const formatSize = (object, path) => {
	const size = objectPath.get(object, path);

	if (size) {
		const decimals = 2;
		if (size === 0) return "0 Bytes";

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

		const i = Math.floor(Math.log(size) / Math.log(k));

		return parseFloat((size / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
	}
};

export const formatPrice = (object, path) => {
	const price = objectPath.get(object, path);

	if (!price) return "0.00";

	var amount = parseFloat(price).toFixed(2);
	return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatLink = (object, displayPath, url) => {
	const display = objectPath.get(object, displayPath);

	return (
		<Link to={url} className="underline flex items-center">
			<HiLink className="mr-1 flex-shrink-0" /> {display}
		</Link>
	);
};

export const formatMedia = (object, srcPath, altPath, className) => {
	const file = objectPath.get(object, `${srcPath}.0`);

	if (!file)
		return (
			<img
				className={`${className ?? "w-32 mx-auto"}`}
				src={"/images/placeholder.jpg"}
				alt="profile"
			/>
		);

	const src = file.url ? file.url : `${API_ROOT}/${file.id}`;
	const type = file.mime;

	if (src) {
		if (["video/mp4"].includes(type))
			return (
				<video
					className={`${className ?? "w-32 mx-auto"}`}
					crossOrigin="anonymous"
					src={src}
					alt={objectPath.get(object, altPath)}
				/>
			);
		return (
			<img
				className={`${className ?? "w-32 mx-auto"}`}
				crossOrigin="anonymous"
				src={src}
				alt={objectPath.get(object, altPath)}
			/>
		);
	}
};

export const upperFirst = (object, path) => {
	const value = objectPath.get(object, path);

	if (value) return <div className="first">{value}</div>;
};

export const truncateString = (object, path) => {
	const value = path ? objectPath.get(object, path) : object;

	if (value) return <div className="flex w-32 truncate">{value}...</div>;
};

export const userField = (user) => {
	const { firstname, lastname, position } = user;
	const src = getAbsolutePath(user.profile, {
		placeholder: "/images/profile.png",
	});

	return (
		<div className="flex items-center w-64" key={user.id}>
			<img
				className="w-12 h-12 border rounded-full object-contain mr-1"
				crossOrigin="anonymous"
				src={src}
				alt={firstname}
			/>
			<div className="whitespace-normal">
				<div className="uppercase">
					{firstname} {lastname}
				</div>
				<div>{position}</div>
			</div>
		</div>
	);
};

export const translateCell = (object, t, root, path) => {
	const value = objectPath.get(object, path);

	if (!value) return;

	if (value) return t(`const.${root}.${value}`);
};

export const nameFormat = (firstname, lastname) => {
	return firstname + " " + lastname;
};

export const getAbsolutePath = (
	field,
	{ placeholder = "/images/placeholder.jpg", index = 0 } = {}
) => {
	const file = Array.isArray(field) ? objectPath.get(field, index) : field;

	if (!file) return placeholder;

	return file.url ?? `${API_ROOT}/${file.id}`;
};

export const more = (to, target) => {
	return (
		<Link to={to} target={target} className="button bg-secondary-100">
			{t("button.more")} <HiArrowSmRight className="ml-1 flex-shrink-0" />
		</Link>
	);
};

export const getTranslated = (lang, doc, field) => {
	if (!doc) return null;

	if (lang === "ru") return doc?.trans?.ru?.[field];
	if (lang === "en") return doc?.trans?.us?.[field];
	return doc[field];
};
