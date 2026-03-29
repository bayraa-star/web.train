import mongoose from "mongoose";
import { AuditFields, SchemaConfig } from "./_common";

const Name = "job";
const Schema = new mongoose.Schema(
  {
    name: { type: String, index: true, trim: true },
    description: { type: String, index: true, trim: true },
    ...AuditFields,
  },
  SchemaConfig
);

module.exports = mongoose.model(Name, Schema);
