import mongoose from "mongoose";
import { AuditFields, SchemaConfig } from "./_common";

const Name = "log";
const Schema = new mongoose.Schema(
  {
    user: { type: String, index: true },
    originalUrl: { type: String, index: true },
    method: { type: String, index: true },
    useragent: { type: String, index: true },
    params: { type: Object, index: true },
    query: { type: Object, index: true },
    body: { type: Object, index: true },
    version: { type: String, index: true },
    ip: { type: String, index: true },
    model: { type: String, index: true },
    type: {
      type: String,
      index: true,
      enum: ["insert", "read", "delete", "update", "table", "login", "verify"],
    },
    info: { type: String, index: true },
    ...AuditFields,
  },
  SchemaConfig
);
module.exports = mongoose.model(Name, Schema);
