import { useApp } from "../providers/app";
import Swal from "sweetalert2";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Field from "../components/Field";
import { useState } from "react";

import axios from "axios";
import Loader from "../template/Loader";
import { API_ROOT } from "../defines";

const Login = () => {
  const { login } = useApp();
  const [loading, setloading] = useState(false);

  const onSubmit = async ({ username, password }) => {
    try {
      setloading(true);
      const response = await axios({
        baseURL: API_ROOT,
        url: "/user/login",
        method: "POST",
        data: {
          username: username,
          password: password,
        },
      });

      return login(response.data);
    } catch (error) {
      setloading(false);
      return Swal.fire(
        `Анхааруулга`,
        error.response?.data?.message || error.toString(),
        "error"
      );
    }
  };

  const Validation = Yup.object().shape({
    username: Yup.string().required(`Хэрэглэгчийн нэрээ оруулна уу.`),
    password: Yup.string().required(`Нууц үгээ оруулна уу.`),
  });

  return (
    <div className="text-center justify-center w-96 mx-auto">
      <Formik
        initialValues={{
          username: "",
          password: "",
        }}
        validationSchema={Validation}
        onSubmit={onSubmit}
      >
        {() => (
          <Form className="flex flex-col gap-5 my-10 mt-5">
            <div className="text-5xl mb-4">LABEL ODT</div>
            <Field
              autoFocus={true}
              name="username"
              placeholder={`Хэрэглэгчийн нэр`}
              className={` uppercase p-3 px-4 w-full rounded-lg`}
              type="text"
            />

            <Field
              name="password"
              autoFocus={true}
              placeholder={`Нууц үг`}
              type="password"
              className={`p-3 px-4 w-full rounded-lg`}
            />

            <button className="bg-odt-primary p-4" type="submit">
              {loading ? <Loader /> : `Нэвтрэх`}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Login;
