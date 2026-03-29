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

const getToken = (request) => {
  const token = request?.headers?.authorization?.split(" ")[1];

  if (!token) throw new Unauthorized("Нэвтрэх шаардлагатай");

  return token;
};

const authenticateRequest = (request, accesses) => {
  try {
    const token = getToken(request);
    const user = jwt.verify(token, SECRET);

    request.user = user;

    if (accesses) {
      checkAccess(accesses, user.role);
    }
  } catch (error) {
    if (error instanceof Unauthorized) throw error;

    throw new Unauthorized("Нэвтрэх хугацаа дууссан эсвэл токен буруу байна");
  }
};

const applyAuditFields = (request) => {
  const { body, method, user } = request;

  if (!body || typeof body !== "object") return;

  if (method === "POST") {
    body.created = new Date();
    if (user?.id) body.createdby = user.id;
    return;
  }

  body.modified = new Date();
  if (user?.id) body.modifiedby = user.id;
};

const Validator = (fields, accesses, options = {}) => {
  const { auth = true, audit = auth } = options;

  return [
    checkSchema(fields),
    (request, {}, next) => {
      const errors = validationResult(request);

      if (!errors.isEmpty()) {
        throw new Exception(errors.array()[0]?.msg);
      }

      if (auth) {
        authenticateRequest(request, accesses);
      }

      if (audit) {
        applyAuditFields(request);
      }

      next();
    },
  ];
};

export const authenticate = (accesses) => {
  return (request, response, next) => {
    authenticateRequest(request, accesses);
    next();
  };
};

export const string = ({ optional, min, max = 250 } = {}) => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (optional && (value === undefined || value === null || value === "")) {
        return true;
      }

      if (!optional && !value) {
        throw new Exception(`${path} утга оруулах шаардлагатай`);
      }
      if (min && value.length < min)
        throw new Exception(`${path}-ийн урт ${min}-с бага байж болохгүй`);
      if (max && value.length > max)
        throw new Exception(`${path}-ийн урт ${max}-с их байж болохгүй`);

      return true;
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

      return true;
    },
  },
});

export const array = (list = [], { optional = false } = {}) => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (optional && (value === undefined || value === null || value === "")) {
        return true;
      }

      if (!list.includes(value)) {
        throw new Exception(`${path} буруу утга байна`);
      }

      return true;
    },
  },
});

export const id = () => ({
  custom: {
    options: (value, { req, location, path }) => {
      if (!Types.ObjectId.isValid(value))
        throw new Exception(`${path} буруу утга байна`);

      return true;
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
