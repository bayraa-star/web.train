const Text = ({
  type = "text",
  className = "",
  rows = 3,
  form,
  field,
  value,
  onChange,
  ...restProps
}) => {
  const textProps = {
    ...restProps,
    type,
    className: `${className}`,
    value: (form ? (field.value === 0 ? "0" : field.value) : value) || "",
    onChange: (e) => {
      let tmp = e.target.value.toString();
      form ? form.setFieldValue(field.name, tmp) : onChange(tmp);
    },
    ...(type === "number"
      ? {
          onWheel: function (e) {
            e.target.blur();
          },
        }
      : null),
  };

  if (type === "textarea")
    return (
      <textarea className="text-black " {...textProps} rows={rows}></textarea>
    );

  return (
    <input
      className="text-black  p-3 px-4 w-full rounded-lg"
      {...textProps}
      autoComplete="off"
    />
  );
};

export default Text;
