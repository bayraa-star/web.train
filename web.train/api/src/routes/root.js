import express from "express";
import { create, read, update, table, deleteRoot } from "../controllers/root";

let router = express.Router();

router.post("/", create);
router.get("/view/:id", read);
router.put("/:id", update);
router.delete("/:id", deleteRoot);
router.post("/table", table);
export default router;
