import ReactDatePicker from "react-datetime";
import { useTranslation } from "react-i18next";

import "moment/locale/mn";
import "moment/locale/en-in";
import "moment/locale/zh-cn";

import "react-datetime/css/react-datetime.css";

const I18 = {
  MN: "mn",
  US: "en-in",
  CN: "zh-cn",
  undefined: "mn",
};

const DatePicker = ({
  placeholder,
  disabled,
  form,
  field,
  value,
  onChange,
  selected,
  time,
  format = "YYYY-MM-DD",
  ...restProps
}) => {
  const { i18n } = useTranslation();

  const parseValue = (form, field, value) => {
    let tmp = form ? field.value : value;

    if (tmp) tmp = new Date(tmp);

    return tmp;
  };

  const pickerProps = {
    ...restProps,
    className: "w-full border-none",
    locale: I18[i18n.language] || "mn",
    viewMode: "days",
    dateFormat: format,
    timeFormat: time ? "HH:mm:ss" : false,
    closeOnSelect: true,
    inputProps: {
      placeholder: placeholder || (time ? "YYYY-MM-DD HH:mm:ss" : format),
      disabled: disabled,
    },
    selected: form ? field.value : selected,
    value: parseValue(form, field, value),
    onChange: (value) => {
      if (value === "" || value._isAMomentObject) {
        console.log("🚀 ~ value:", new Date(value));
        form
          ? form.setFieldValue(field.name, new Date(value))
          : onChange(value);
      }
    },
  };

  return <ReactDatePicker {...pickerProps} />;
};

export default DatePicker;
