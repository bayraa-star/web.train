import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";
import { mainApi } from "../providers/api";
import objectPath from "object-path";
import { translateError } from "../providers/alert";

const templateWrapper = (templateString) => {
  return (templateData) =>
    // eslint-disable-next-line no-new-func
    new Function(
      `{${Object.keys(templateData).join(",")}}`,
      "return `" + templateString + "`"
    )(templateData);
};

const Select = ({
  items,
  disabled,
  axio,
  axioAdapter,
  valueField = "_id",
  labelField = "name",
  labelTemplate,
  isMulti,
  closeOnSelect,
  form,
  field,
  nullType,
  placeholder,
  ...restProps
}) => {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(items || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await mainApi(axio);
        console.log("🚀 ~ fetchData ~ response:", response);

        response &&
          setOptions(
            axioAdapter
              ? axioAdapter(response.data)
              : response.data.map((item) => ({
                  value: valueField ? objectPath.get(item, valueField) : item,
                  label: labelTemplate
                    ? templateWrapper(labelTemplate)(item)
                    : labelField
                    ? objectPath.get(item, labelField)
                    : item,
                }))
          );
      } catch (error) {
        translateError(error);
      } finally {
        setLoading(false);
      }
    };

    if (axio) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axio, i18n.language]);

  const value = form ? field.value : restProps.value;
  const selectProps = {
    ...restProps,
    className: "rc-container",
    classNamePrefix: "rc",
    placeholder: placeholder || `Сонгох`,
    noOptionsMessage: () => `Хоосон`,
    isDisabled: disabled,
    isMulti,
    isClearable: true,
    closeMenuOnSelect: closeOnSelect || !isMulti,
    options: nullType
      ? [
          {
            value: { $eq: nullType === "array" ? [] : null },
            label: `Мэдээлэл байхгүй`,
          },
          ...options,
        ]
      : options,
    value: form
      ? isMulti
        ? options.filter((option) => value && value.includes(option.value))
        : options.find((option) => value === option.value)
      : restProps.value,
    onChange: (selected) => {
      let _value = isMulti
        ? (selected &&
            selected.map((option) => {
              return option.value;
            })) ||
          []
        : (selected && selected.value) || null;

      form
        ? form.setFieldValue(field.name, _value)
        : restProps.onChange(_value);
    },
  };

  return (
    <div className="relative w-full">
      {loading && <Loader size={10} />}
      <ReactSelect {...selectProps} />
    </div>
  );
};

export default Select;
