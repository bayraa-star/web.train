import express from "express";
import basicAuth from "express-basic-auth";
import {
  login,
  create,
  read,
  update,
  table,
  deleteUser,
} from "../controllers/user";
import {
  createValidator,
  updateValidator,
  readValidator,
  tableValidator,
  deleteValidator,
} from "../validators/user";
import { BASIC_AUTH } from "../consts";

let router = express.Router();

const basicUsers =
  BASIC_AUTH?.username && BASIC_AUTH?.password
    ? {
        [BASIC_AUTH.username]: BASIC_AUTH.password,
      }
    : {};

const createUserBasicAuthMiddleware = basicAuth({
  users: basicUsers,
  challenge: true,
  unauthorizedResponse: () => ({
    success: false,
    message: "Basic authentication failed",
  }),
});

router.post("/login", login);
router.post("/", createUserBasicAuthMiddleware, createValidator, create);
router.get("/view/:id", readValidator, read);
router.put("/:id", updateValidator, update);
router.delete("/:id", deleteValidator, deleteUser);
router.post("/table", tableValidator, table);
export default router;
