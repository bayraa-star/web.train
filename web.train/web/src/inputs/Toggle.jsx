import "react-toggle/style.css";
import ReactToggle from "react-toggle";

const Toggle = ({ form, field, value, disabled, onChange, ...restProps }) => {
  const toggleProps = {
    disabled: !!disabled,
    checked: value || field?.value,
    onChange: (e) => {
      form
        ? form.setFieldValue(field.name, e.target.checked)
        : onChange(e.target.checked);
    },
    ...restProps,
  };

  return <ReactToggle {...toggleProps} />;
};

export default Toggle;
