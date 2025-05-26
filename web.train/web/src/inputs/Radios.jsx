import { useEffect, useState } from "react";
import { mainApi } from "../providers/api";
import Loader from "../components/Loader";
import { translateError } from "../providers/alert";

const Radios = ({
  axio,
  value,
  onChange,
  items,
  form,
  field,
  disabled,
  renderItem,
}) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(items || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await mainApi(axio);
        response && setOptions(response.data);
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
      ? form.setFieldValue(field.name, option._id)
      : onChange && onChange(option._id);
  };

  const selected = form ? field.value : value;

  return (
    <div className={`relative w-full px-2 py-4 ${disabled ? "disabled" : ""}`}>
      {loading && <Loader size={10} />}
      {options.map((option, index) => {
        if (!option) return null;

        return (
          <div
            key={index}
            onClick={() => {
              if (!disabled) handleChange(option);
            }}
            className={`flex w-full ${disabled ? "" : "cursor"}`}
          >
            {renderItem(option, selected, index)}
          </div>
        );
      })}
    </div>
  );
};

export default Radios;
