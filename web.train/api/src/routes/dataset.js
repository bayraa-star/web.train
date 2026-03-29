import express from "express";
import { authenticate } from "../validators/_common";
import {
  getDatasetExportStatus,
  startDatasetExport,
} from "../controllers/dataset";

let router = express.Router();

router.post("/export", authenticate(["admin"]), startDatasetExport);
router.get("/export/:id", authenticate(["admin"]), getDatasetExportStatus);

export default router;
