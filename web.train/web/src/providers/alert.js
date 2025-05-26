import Swal from "sweetalert2";
import i18n from "./i18n";

export const Alert = Swal.mixin({
  customClass: {
    confirmButton: "swal-btn secondary",
    cancelButton: "swal-btn primary",
  },
  buttonsStyling: false,
});

export const translateError = (error) => {
  return Alert.fire({
    html: i18n.t(error),
    icon: "warning",
  });
};

export const successAlert = (path, content) => {
  return Alert.fire({
    html: `${i18n.t(path || "action.success")}<br/>${content ?? ""}`,
    icon: "success",
    timer: content ? undefined : 1000,
  });
};
export const errorAlert = (path, content) => {
  return Alert.fire({
    html: `${i18n.t(path || "action.error")}<br/>${content ?? ""}`,
    icon: "error",
    timer: content ? undefined : 1000,
  });
};

export const confirmPopup = (path) => {
  return Alert.fire({
    title: i18n.t("action.confirm"),
    html: i18n.t(path),
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: i18n.t("action.yes"),
    cancelButtonText: i18n.t("action.cancel"),
  });
};
