import { Formik, Form as FormikForm } from "formik";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Back } from "../template";
import Loader from "../components/Loader";
import { useEffect } from "react";
import { mainApi } from "../providers/api";
import { confirmPopup, successAlert, translateError } from "../providers/alert";
import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin2Fill,
  RiEdit2Fill,
} from "react-icons/ri";
import objectPath from "object-path";

const Form = ({
  id,
  editable,
  children,
  model,
  init,
  success,
  validationSchema,
  beforeSubmit,
  containerClass = "",
  view,
  isDeletable,
  back,
  text,
  setPosition,
  positionType,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(id);
  const [submited, setSubmited] = useState();
  const [initialValues, setInitialValues] = useState(init);

  useEffect(() => {
    const fetch = async (id) => {
      setLoading(true);
      const response = await mainApi(`/${model}/view/${id}`);

      response && setInitialValues(response.data);

      if (setPosition && positionType) {
        setPosition({
          lat: objectPath.get(response, "data.location.coordinates.0"),
          lng: objectPath.get(response, "data.location.coordinates.1"),
        });
      }
      setPosition && setPosition(response.data?.coordinates);
      setLoading(false);
    };

    if (id) fetch(id);
  }, [model, id, disabled, view]);

  const formik = {
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        let data = beforeSubmit ? await beforeSubmit(values) : values;

        const response = await mainApi({
          url: `/${model}/${id ?? ""}`,
          method: id ? "PUT" : "POST",
          data,
        });

        setSubmitting(false);

        if (response) {
          setSubmited(new Date());

          if (success) {
            setDisabled(true);
            success && success({ response: response.data });
          } else {
            navigate(-1);
            successAlert();
          }
        }
      } catch (error) {
        translateError(error);
      }
    },
  };

  const deleteItem = async () => {
    let resonse = await mainApi({
      url: `/${model}/${id}`,
      method: "DELETE",
    });

    if (resonse) {
      successAlert();
      navigate(-1);
    }
  };

  return (
    <div className="relative p-4">
      <Formik {...formik}>
        {({ isSubmitting, values, ...rest }) => {
          const isLoading = loading || isSubmitting;
          const isEditable =
            typeof editable === "function" ? editable(values) : editable;

          return (
            <FormikForm className={` ${containerClass}`} autoComplete="off">
              {isLoading && <Loader size={500} />}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div>{back || <Back />}</div>
                  <div className="text-base ml-2 font-semibold text-black ">
                    {text}
                  </div>
                </div>
                <div className="flex flex-row">
                  {isEditable && !disabled && id && (
                    <button
                      type="button"
                      className="mr-2 gray"
                      onClick={() => {
                        setDisabled(true);
                      }}
                    >
                      <RiCloseLine className="mr-1 text-lg" />
                      {t("action.cancel")}
                    </button>
                  )}
                  {isEditable && isDeletable && disabled && (
                    <div className="mr-2">
                      <button
                        type="button"
                        className="bg-primary-100"
                        onClick={() => {
                          confirmPopup("action.delete").then((result) => {
                            if (result.isConfirmed) {
                              deleteItem();
                            }
                          });
                        }}
                      >
                        <RiDeleteBin2Fill className="mr-1 text-lg" />
                        {t("action.delete")}
                      </button>
                    </div>
                  )}
                  {isEditable && disabled && (
                    <div>
                      <button
                        type="button"
                        className="primary gray"
                        onClick={() => {
                          setDisabled(!disabled);
                        }}
                      >
                        <RiEdit2Fill className="mr-1 text-lg" />
                        {t("action.edit")}
                      </button>
                    </div>
                  )}
                  {!disabled && (
                    <button type="submit" className="bg-odt-primary">
                      {id ? t("action.update") : t("action.create")}
                      <RiCheckLine className="ml-1 text-lg" />
                    </button>
                  )}
                </div>
              </div>
              {disabled && view
                ? view(values)
                : children &&
                  children({
                    loading: isLoading,
                    submited,
                    values,
                    id,
                    disabled,
                    t,
                    form: rest,
                  })}
            </FormikForm>
          );
        }}
      </Formik>
    </div>
  );
};

export default Form;
