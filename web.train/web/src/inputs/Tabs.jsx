import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { mainApi } from "../providers/api";
import Loader from "../components/Loader";
import { translateError } from "../providers/alert";

const className = "mb-2 mr-2 flex items-center p-2 border rounded";
const Tabs = ({
  axio,
  axioAdapter,
  color = "secondary-100",
  value,
  onChange,
  items,
  all,
  form,
  field,
  disabled,
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(items || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await mainApi(axio);

        response &&
          setOptions(
            axioAdapter
              ? axioAdapter(response.data)
              : response.data.map((value) => ({
                  value,
                  label: value,
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
  }, [axio]);

  const handleChange = (option) => {
    form
      ? form.setFieldValue(field.name, option.value)
      : onChange && onChange(option.value);
  };

  const selected = form ? field.value : value;

  return (
    <div className="relative">
      {loading && <Loader size={50} />}
      <div className={`flex flex-wrap select-none`}>
        {[
          all ? { value: null, label: t("control.radios.all") } : undefined,
          ...options,
        ].map((option, index) => {
          if (!option) return null;

          return (
            <div
              key={index}
              onClick={() => {
                if (!disabled) handleChange(option);
              }}
              className={`${className} ${
                selected === option.value
                  ? `text-white bg-${color} border-${color}`
                  : "text-dark-100"
              } ${disabled ? "" : "cursor"}`}
            >
              {option.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
