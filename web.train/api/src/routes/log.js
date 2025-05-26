import express from "express";
import { read, table } from "../controllers/log";
import { readValidator, tableValidator } from "../validators/log";

let router = express.Router();

router.get("/view/:id", readValidator, read);
router.post("/table", tableValidator, table);
export default router;
