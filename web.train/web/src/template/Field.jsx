import { Field as FormikField, useField } from "formik";
import { useTranslation } from "react-i18next";

const Field = ({ helper, label, button, inline, reverse, ...props }) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField(props.name);

  const error = meta.touched && meta.error;

  return (
    <div className={`field   ${error ? "error" : ""}`}>
      <div className={`${inline ? "flex items-center gap-2" : ""}`}>
        {label && <label className="label order-1">{t(label)}</label>}
        {helper && helper({ field, meta, helpers })}
        {error && (
          <div className={`text-xs mb-2 leading-none italic`}>
            {t(`error.required`)}
          </div>
        )}
        <div
          className={`${button ? "flex" : "block"} ${
            reverse ? "order-0" : "order-2"
          }`}
        >
          <FormikField {...props} />
          <div className="flex flex-grow-0">
            {button && button({ field, meta, helpers })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Field;
