import mongoose from "mongoose";
import { AuditFields, SchemaConfig } from "./_common";

const Name = "file";
const Schema = new mongoose.Schema(
  {
    ...AuditFields,
    root: { type: mongoose.Schema.Types.ObjectId, ref: "root", index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "job", index: true },
    label: { type: String, index: true },
    originalName: { type: String, index: true },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    labeledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    labeledAt: { type: Date, index: true },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    approvedAt: { type: Date, index: true },
    declinedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    declinedAt: { type: Date, index: true },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    deletedAt: { type: Date, index: true },
    status: {
      type: String,
      index: true,
      enum: ["uploaded", "labeled", "approved", "deleted"],
      default: "uploaded",
    },
    id: { type: String, index: true, trim: true },
    name: { type: String },
    mime: { type: String },
    size: { type: Number, index: true },
    encoding: { type: String },
    type: { type: String, index: true },
  },
  SchemaConfig
);

module.exports = mongoose.model(Name, Schema);
