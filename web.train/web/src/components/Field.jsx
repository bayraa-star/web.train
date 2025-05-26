import { Field as FormikField, ErrorMessage } from "formik";

const Field = ({ name, label, placeholder, className, ...props }) => {
  const { type } = props;

  return (
    <div className={`form-control ${type === "checkbox" ? "flex" : ""}`}>
      {label && (
        <label className={"select-none"} htmlFor={name}>
          {label}
        </label>
      )}
      <ErrorMessage
        name={name}
        component="span"
        className="error text-xs mb-2 leading-none italic"
      />
      <FormikField
        id={name}
        name={name}
        {...props}
        placeholder={placeholder || label}
        className={`${className} ${type === "checkbox" ? "order-first" : ""}`}
      />
    </div>
  );
};

export default Field;
