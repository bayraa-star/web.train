import express from "express";
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

let router = express.Router();

router.post("/login", login);
router.post("/", createValidator, create);
router.get("/view/:id", readValidator, read);
router.put("/:id", updateValidator, update);
router.delete("/:id", deleteValidator, deleteUser);
router.post("/table", tableValidator, table);
export default router;
