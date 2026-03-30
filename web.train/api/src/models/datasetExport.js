import mongoose from "mongoose";
import { AuditFields, SchemaConfig } from "./_common";

const Name = "datasetExport";
const Schema = new mongoose.Schema(
  {
    ...AuditFields,
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      index: true,
    },
    jobName: { type: String, index: true },
    taskType: {
      type: String,
      index: true,
      enum: ["ocr", "ocr_detection", "detection"],
      default: "ocr",
    },
    scope: {
      type: String,
      index: true,
      enum: ["approved", "all"],
      default: "approved",
    },
    status: {
      type: String,
      index: true,
      enum: ["queued", "preparing", "copying", "zipping", "finished", "error"],
      default: "queued",
    },
    progress: { type: Number, index: true, default: 0 },
    message: { type: String },
    totalFiles: { type: Number, default: 0 },
    processedFiles: { type: Number, default: 0 },
    totalEntries: { type: Number, default: 0 },
    zippedEntries: { type: Number, default: 0 },
    downloadPath: { type: String, index: true },
    fileName: { type: String },
    error: { type: String },
    finishedAt: { type: Date, index: true },
  },
  SchemaConfig
);

module.exports = mongoose.model(Name, Schema);
