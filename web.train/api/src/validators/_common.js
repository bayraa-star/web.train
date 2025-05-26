import { checkSchema } from "express-validator";
import { validationResult } from "express-validator";
import { Exception, Unauthorized } from "../utils";
import { Types } from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SECRET } from "../consts";
const checkAccess = (accesses, role) => {
  if (!accesses.includes(role)) throw new Unauthorized("Зөвшөөрөлгүй хандалт");
  return;
};

const Validator = (fields, accesses) => {
  return [
    checkSchema(fields),
    (request, {}, next) => {
      const { errors } = validationResult(request);

      if (errors.length > 0) {
        throw new Exception(errors[0]?.msg);
      }

      const { body, method } = request;
      const token = request?.headers?.authorization?.split(" ")[1];

      if (!token) throw Error("Not authorizartion");
      //
      const user = jwt.decode(token, SECRET);
      request.user = user;
      if (accesses) {
        checkAccess(accesses, user.role);
      }
      if (method == "POST") {
        body.created = new Date();
        body.createdby = user?.id;
      } else {
        body.modified = new Date();
        body.modifiedby = user?.id;
      }

      next();
    },
  ];
};

export const string = ({ optional, min, max = 250 } = {}) => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (!optional && !value) {
        throw new Exception(`${path} утга оруулах шаардлагатай`);
      }
      if (min && value.length < min)
        throw new Exception(`${path}-ийн урт ${min}-с бага байж болохгүй`);
      if (max && value.length > max)
        throw new Exception(`${path}-ийн урт ${max}-с их байж болохгүй`);

      return value;
    },
  },
  customSanitizer: {
    options: (value, { req, location, path }) => {
      return value || "";
    },
  },
});

export const number = (optional, { min, max } = {}) => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (!optional && !value && value !== 0) {
        throw new Exception(`${path} утга оруулах шаардлагатай`);
      }
      if (min && value < min)
        throw new Exception(`${path}-ийн утга ${min}-с бага байж болохгүй`);
      if (max && value > max)
        throw new Exception(`${path}-ийн утга ${max}-с их байж болохгүй`);

      return value + "";
    },
  },
});

export const array = (list = []) => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (!list.includes(value)) {
        throw new Exception(`${path} буруу утга байна`);
      }

      return value;
    },
  },
});

export const id = () => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (!Types.ObjectId.isValid(value))
        throw new Exception(`${path} буруу утга байна`);

      return value;
    },
  },
});

export const password = (field) => ({
  customSanitizer: {
    options: (value, { req, location, path }) => {
      const hash = crypto
        .createHash("sha256")
        .update(req.body[field])
        .digest("hex");
      return hash;
    },
  },
});

export const phone = () => {
  return string({ min: 8, max: 8 });
};

export default Validator;
