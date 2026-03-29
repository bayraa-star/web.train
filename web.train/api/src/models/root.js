import mongoose from "mongoose";
import { AuditFields, FileField, SchemaConfig } from "./_common";

const Name = "root";
const Schema = new mongoose.Schema(
  {
    root: { type: String, index: true },
    directory: { type: String, index: true },
    description: { type: String, index: true },
    ...AuditFields,
  },
  SchemaConfig
);
module.exports = mongoose.model(Name, Schema);
