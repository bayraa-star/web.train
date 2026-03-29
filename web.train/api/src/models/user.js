import mongoose from "mongoose";
import { AuditFields, FileField, SchemaConfig } from "./_common";

const Name = "user";
const Schema = new mongoose.Schema(
  {
    username: { type: String, index: true, uppercase: true },
    role: {
      type: String,
      index: true,
      enum: ["admin", "labeler", "examiner"],
    },
    firstname: { type: String, index: true },
    lastname: { type: String, index: true },
    phone: { type: String, index: true },
    password: { type: String, index: true },
    department: { type: String, index: true },
    profile: FileField,
    permissions: { type: [String] },
    app: { type: [String] },
    group: { type: [String] },
    grouplist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "device",
        },
      ],
    },
    rank: { type: String, index: true },
    position: { type: String, index: true },
    ...AuditFields,
  },
  SchemaConfig
);
module.exports = mongoose.model(Name, Schema);
