import mongoose from "mongoose";

export const SchemaConfig = {
  toObject: {
    virtuals: true,
  },
  toJSON: {
    virtuals: true,
  },
  minimize: false,
};

export const AuditFields = {
  created: {
    type: Date,
    index: true,
    default: () => new Date(),
  },
  modified: {
    type: Date,
    index: true,
  },
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  modifiedby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
};

export const FileField = [
  {
    id: { type: String, index: true },
    name: { type: String },
    mime: { type: String },
    type: { type: String },
    size: { type: Number },
    encoding: { type: String },
    duration: { type: Number },
  },
];

export const PointField = {
  type: {
    type: String,
    default: "Point",
  },
  coordinates: {
    type: [Number],
    default: [0, 0],
  },
};
