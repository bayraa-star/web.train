import express from "express";
import { authenticate } from "../validators/_common";
import {
  deleteDatasetExport,
  listDatasetExports,
  getDatasetExportStatus,
  startDatasetExport,
} from "../controllers/dataset";

let router = express.Router();

router.post("/export", authenticate(["admin"]), startDatasetExport);
router.get("/export", authenticate(["admin"]), listDatasetExports);
router.get("/export/:id", authenticate(["admin"]), getDatasetExportStatus);
router.delete("/export/:fileName", authenticate(["admin"]), deleteDatasetExport);

export default router;
