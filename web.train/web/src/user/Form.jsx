import * as Yup from "yup";
import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { stringValidation } from "../providers/validations";
import Field from "../components/Field";
import { FileUpload, Select, Text } from "../inputs";
import { Form } from "../template";
import { SHA256 } from "crypto-js";
import { mainApi } from "../providers/api";
import objectPath from "object-path";

const UserForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const props = {
    editable: true,
    isDeletable: true,
    model: "user",
    text: id ? "Хэрэглэгчийн мэдээлэл" : "Хэрэглэгч бүртгэх",
    id: id,
    init: {},
    validationSchema: Yup.object().shape({
      lastname: stringValidation(true),
      firstname: stringValidation(true),
      phone: stringValidation(true),
      role: stringValidation(true),
      username: stringValidation(true),
      department: stringValidation(true),
      position: stringValidation(true),
      password: stringValidation(true),
    }),
  };
  const beforeSubmit = async (data) => {
    let temp = data;

    if (!id) temp.password = SHA256(data?.password).toString();
    if (data?.group?.length > 0) {
      console.log("dddd");
      const arr = data?.group;
      const groupList = [];

      const result = await mainApi({
        url: `/group/table`,
        method: "POST",
        data: {
          find: {
            _id: {
              $in: arr,
            },
          },
        },
      });
      result?.data?.items?.map((row) => {
        const list = objectPath.get(row, "list");
        groupList.push(...list);
      });
      temp.grouplist = groupList;
    }

    return temp;
  };
  return (
    <Form {...props} beforeSubmit={beforeSubmit}>
      {({ submited, disabled, values }) => {
        return (
          <div className="p-5 bg-white  grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <Field
                name="profile"
                label={`Зураг`}
                disabled={disabled}
                component={FileUpload}
                submited={submited}
                root="profile"
                accept="image/*"
                limit={500}
              />
              <Field
                name="lastname"
                label={`Эцэг/эх/-ийн нэр`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="firstname"
                label={`Нэр`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="phone"
                label={`Утас`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />

              <Field
                name="department"
                label={`Газар, хэлтэс`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="rank"
                label={`Цол`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="position"
                label={`Албан тушаал`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
            </div>
            <div className="flex flex-col gap-4">
              <Field
                name="username"
                label={`Хэрэглэгчийн нэр`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="password"
                label={`Нууц үг`}
                disabled={disabled}
                component={Text}
                type="text"
                className={`text-black `}
              />
              <Field
                name="role"
                label={`Системийн эрх`}
                disabled={disabled}
                component={Select}
                items={[
                  {
                    label: `Админ`,
                    value: `admin`,
                  },
                  {
                    label: `Labeler`,
                    value: `labeler`,
                  },
                  {
                    label: `Examiner`,
                    value: `examiner`,
                  },
                ]}
                type="text"
              />
              <Field
                name="permissions"
                label={`Цэс`}
                disabled={disabled}
                isMulti={true}
                component={Select}
                items={[
                  {
                    label: `Хянах самбар`,
                    value: `dashboard`,
                  },
                  {
                    label: `Зөрчил`,
                    value: `violation`,
                  },
                  {
                    label: `Тээврийн хэрэгсэл`,
                    value: `vehicle`,
                  },
                  {
                    label: `Төхөөрөмж`,
                    value: `device`,
                  },
                  {
                    label: `Груп`,
                    value: `group`,
                  },
                  {
                    label: `Хэрэглэгч`,
                    value: `user`,
                  },
                  {
                    label: `Илгээсэн`,
                    value: `sent`,
                  },
                  {
                    label: `Үйлдлийн түүх`,
                    value: `log`,
                  },
                  {
                    label: `Эрэн сурвалжлалт`,
                    value: `asap`,
                  },
                  {
                    label: `Сервис`,
                    value: `api`,
                  },
                  {
                    label: `Дугаарын хягаарлалт`,
                    value: `limit`,
                  },
                ]}
                type="text"
              />
              <Field
                name="app"
                label={`Апп`}
                disabled={disabled}
                isMulti={true}
                component={Select}
                items={[
                  {
                    label: `Татвар`,
                    value: `tax`,
                  },
                  {
                    label: `Даатгал`,
                    value: `insurance`,
                  },
                  {
                    label: `Оншилгоо`,
                    value: `inspection`,
                  },
                  {
                    label: `Торгууль`,
                    value: `penalty`,
                  },
                  {
                    label: `АСАП`,
                    value: `asap`,
                  },
                  {
                    label: `Согтуу`,
                    value: `drunk`,
                  },
                  {
                    label: `Дугаарын хязгаарлалт`,
                    value: `limit`,
                  },
                ]}
                type="text"
              />
              <Field
                name="group"
                label={`Груп`}
                disabled={disabled}
                isMulti={true}
                component={Select}
                axio={"/group/list"}
                axioAdapter={(data) => {
                  return data.map(({ _id, name, direction }) => ({
                    value: _id,
                    label: name,
                  }));
                }}
              />
            </div>
          </div>
        );
      }}
    </Form>
  );
};

export default UserForm;
