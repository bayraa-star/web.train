import { Field as FormikField, ErrorMessage } from "formik";

const FieldCustom = ({ name, label, placeholder, className, ...props }) => {
  const { type } = props;

  return (
    <div
      className={`form-control flex flex-col  ${
        type === "checkbox" ? "flex" : ""
      }`}
    >
      {label && (
        <label className={"select-none"} htmlFor={name}>
          {label}
        </label>
      )}

      <FormikField
        id={name}
        name={name}
        {...props}
        placeholder={placeholder || label}
        className={` ${className} ${type === "checkbox" ? "order-first" : ""}`}
      />
      <ErrorMessage
        name={name}
        component="span"
        className="error text-xs mb-2 leading-none italic ml-4"
      />
    </div>
  );
};

export default FieldCustom;
