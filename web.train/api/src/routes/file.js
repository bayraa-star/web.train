import express from "express";
import { saveToFs, removeFromFs } from "../controllers/file";

let router = express.Router();

router.post("/fs/:root", saveToFs);
router.delete("/fs", removeFromFs);

export default router;
