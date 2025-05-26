import { FieldArray as FormikFieldArray, useField } from "formik";
import { useTranslation } from "react-i18next";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiDeleteBinLine,
} from "react-icons/ri";

const buttonClass =
  "h-8 w-8 flex items-center justify-center text-white cursor";

const Add = ({ helper, initial, index }) => {
  return (
    <div
      className={`${buttonClass} bg-odt-primary`}
      onClick={() => {
        helper.insert(index, initial);
      }}
    >
      <RiAddLine />
    </div>
  );
};
const FieldArray = ({
  helper,
  label,
  disabled,
  initial,
  renderItem,
  renderHeader,
  itemClass = "p-4 border shadow-lg",
  minimal,
  ...props
}) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField(props.name);

  return (
    <div className={`field`}>
      {label && <label className="label order-1">{t(label)}</label>}
      <FormikFieldArray
        {...props}
        render={(arrayHelpers) => {
          if (minimal)
            return (
              <>
                {field.value &&
                  field.value.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className="flex w-full my-2 items-center"
                      >
                        {renderItem(item, index)}
                        {!disabled && (
                          <div
                            onClick={() => {
                              arrayHelpers.remove(index);
                            }}
                            className={`${buttonClass} bg-primary-100 ml-2`}
                          >
                            <RiDeleteBinLine />
                          </div>
                        )}
                      </div>
                    );
                  })}
                {!disabled && (
                  <div className="mb-4">
                    <Add
                      helper={arrayHelpers}
                      initial={initial}
                      index={field.value.length}
                    />
                  </div>
                )}
              </>
            );

          return (
            <div>
              {!disabled && (
                <div className="mb-4 mt-4">
                  <Add helper={arrayHelpers} initial={initial} index={0} />
                </div>
              )}
              <div className="flex flex-col gap-8">
                {field.value &&
                  field.value.map((item, index) => {
                    return (
                      <div key={index}>
                        <div className={itemClass}>
                          <div className="border-b pb-2 mb-2 flex items-center justify-between">
                            <div className="self-center">
                              {renderHeader && renderHeader(item, index)}
                            </div>
                            {!disabled && (
                              <div className="flex justify-between w-full items-center gap-2">
                                <div>{`${index + 1}.`}</div>
                                <div
                                  onClick={() => {
                                    arrayHelpers.remove(index);
                                  }}
                                  className={`${buttonClass} bg-primary-100`}
                                >
                                  <RiDeleteBinLine />
                                </div>
                              </div>
                            )}
                          </div>
                          {renderItem(item, index)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        }}
      />
      {helper && (
        <div className={`text-sm my-2 leading-none`}>
          {helper && helper({ field, meta, helpers })}
        </div>
      )}
    </div>
  );
};

export default FieldArray;
