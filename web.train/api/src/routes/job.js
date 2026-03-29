import express from "express";
import { create, read, update, table, deleteJob } from "../controllers/job";
import {
  createValidator,
  updateValidator,
  readValidator,
  tableValidator,
  deleteValidator,
} from "../validators/job";

let router = express.Router();

router.post("/", createValidator, create);
router.get("/view/:id", readValidator, read);
router.put("/:id", updateValidator, update);
router.delete("/:id", deleteValidator, deleteJob);
router.post("/table", tableValidator, table);

export default router;
