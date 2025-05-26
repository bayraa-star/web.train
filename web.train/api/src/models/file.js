import mongoose from "mongoose";
import { AuditFields, SchemaConfig } from "./_common";

const Name = "file";
const Schema = new mongoose.Schema(
  {
    ...AuditFields,
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
