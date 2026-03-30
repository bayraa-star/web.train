import express from "express";
import { readMetrics, readMonitor } from "../controllers/systemMonitor";
import { authenticate } from "../validators/_common";

const router = express.Router();

router.get("/metrics", authenticate(["admin"]), readMetrics);
router.get("/:name", authenticate(["admin"]), readMonitor);

export default router;
