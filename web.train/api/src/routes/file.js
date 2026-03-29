import express from "express";
import {
  approveFile,
  declineFile,
  deleteGenericFiles,
  deleteFile,
  labelFile,
  progressFiles,
  tableFiles,
  trashFile,
  uploadGenericFiles,
  uploadFiles,
} from "../controllers/file";
import { authenticate } from "../validators/_common";

let router = express.Router();

router.post("/fs/:rootId", authenticate(["admin", "labeler", "examiner"]), uploadGenericFiles);
router.delete("/fs/:rootId", authenticate(["admin", "labeler", "examiner"]), deleteGenericFiles);
router.post("/upload", authenticate(["admin"]), uploadFiles);
router.get("/progress", authenticate(["admin"]), progressFiles);
router.post("/table", authenticate(["admin", "labeler", "examiner"]), tableFiles);
router.put("/label/:id", authenticate(["labeler"]), labelFile);
router.put("/trash/:id", authenticate(["labeler"]), trashFile);
router.put("/approve/:id", authenticate(["examiner"]), approveFile);
router.put("/decline/:id", authenticate(["examiner"]), declineFile);
router.delete("/:id", authenticate(["admin"]), deleteFile);

export default router;
