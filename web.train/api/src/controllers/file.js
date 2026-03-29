import fs from "fs";
import { v4 as uuid } from "uuid";
import path from "path";
import { mkdirp } from "mkdirp";
import multer from "multer";
import utf8 from "utf8";
import { Types } from "mongoose";

import File from "../models/file";
import User from "../models/user";
import Job from "../models/job";
import { table } from "../utils/db";
import { Exception, Unauthorized } from "../utils";

const isAdmin = (user) => user?.role === "admin";
const isExaminer = (user) => user?.role === "examiner";
const uploadsRoot = path.resolve("uploads");
const taskUploadsTempRoot = path.join("uploads", "tasks", "_tmp");
const MAX_DATE_SENTINEL = new Date("9999-12-31T23:59:59.999Z");

const getFileType = (mimetype = "") => {
  let type = mimetype.split("/")[0];

  if (["application/octet-stream"].includes(mimetype)) {
    type = "video";
  }
  if (["application/pdf"].includes(mimetype)) {
    type = "pdf";
  }

  return type;
};

const sanitizeDirectorySegment = (value = "") => {
  return value.toString().trim().replace(/[^a-zA-Z0-9_-]/g, "_");
};

const ensureDirectory = (directory) => {
  mkdirp.sync(directory);
  return directory;
};

const createDiskStorage = (getDestination) =>
  multer.diskStorage({
    destination: (request, file, cb) => {
      try {
        cb(null, ensureDirectory(getDestination(request)));
      } catch (error) {
        cb(error);
      }
    },
    filename: ({}, file, cb) => {
      cb(null, uuid() + path.extname(file.originalname));
    },
  });

const serializeUpload = (file) => {
  const { path: filePath, originalname, mimetype, size, encoding } = file;
  const originalName = utf8.decode(originalname);
  const storedName = path.basename(filePath);

  return {
    id: filePath,
    name: storedName,
    originalName,
    mime: mimetype,
    size,
    encoding,
    type: getFileType(mimetype),
  };
};

const getFileScope = (user) => {
  if (isAdmin(user) || isExaminer(user)) return {};

  return {
    assignedTo: user?.id,
  };
};

const getGenericUploadDirectory = (rootId) => {
  const directory = sanitizeDirectorySegment(rootId);

  if (!directory) {
    throw new Exception("rootId утга оруулах шаардлагатай");
  }

  return path.join("uploads", directory);
};

const getUploadDirectory = (assignedTo) => {
  if (!assignedTo) {
    throw new Exception("Labeler is required");
  }

  return path.join("uploads", "tasks", assignedTo.toString());
};

const attachAssignedLabeler = async (request) => {
  const assignedTo = request?.body?.assignedTo;

  if (!assignedTo) {
    throw new Exception("assignedTo утга оруулах шаардлагатай");
  }

  const labeler = await User.findOne({
    _id: assignedTo,
    role: "labeler",
  }).lean();

  if (!labeler) {
    throw new Exception("Labeler олдсонгүй");
  }

  request.assignedLabeler = labeler;

  return labeler;
};

const attachAssignedJob = async (request) => {
  const jobId = request?.body?.jobId;

  if (!jobId) {
    throw new Exception("jobId утга оруулах шаардлагатай");
  }

  if (!Types.ObjectId.isValid(jobId)) {
    throw new Exception("jobId буруу утга байна");
  }

  const job = await Job.findById(jobId).lean();

  if (!job) {
    throw new Exception("Job олдсонгүй");
  }

  request.assignedJob = job;

  return job;
};

const getAccessibleFileById = async (id, user) => {
  const file = await File.findOne({
    _id: id,
    ...getFileScope(user),
  });

  if (!file) {
    throw new Unauthorized("Image not found or access denied");
  }

  return file;
};

const genericFsMultiUpload = multer({
  storage: createDiskStorage((request) =>
    getGenericUploadDirectory(request.params.rootId)
  ),
}).array("upload");

const taskFsMultiUpload = multer({
  storage: createDiskStorage(() => taskUploadsTempRoot),
}).array("upload");

const fileProcessor = async (file, request) => {
  const { user, assignedLabeler, assignedJob } = request;
  const upload = serializeUpload(file);

  return new File({
    job: assignedJob?._id,
    assignedTo: assignedLabeler._id,
    created: new Date(),
    createdby: user?.id,
    status: "uploaded",
    approvedBy: null,
    approvedAt: null,
    declinedBy: null,
    declinedAt: null,
    deletedBy: null,
    deletedAt: null,
    ...upload,
  }).save();
};

const getFileNameWithoutExtension = (filePath = "") => {
  return path.parse(filePath).name;
};

const syncLabelArtifacts = (filePath, label) => {
  const folderPath = path.dirname(filePath);
  const fileName = getFileNameWithoutExtension(filePath);
  const txtPath = path.join(folderPath, `${fileName}.txt`);
  const csvPath = path.join(folderPath, "labels.csv");

  fs.writeFileSync(txtPath, label);

  const rows = fs.existsSync(csvPath)
    ? fs
        .readFileSync(csvPath, "utf8")
        .split("\n")
        .filter(Boolean)
        .filter((row) => row.split(",")[0] !== fileName)
    : [];

  rows.push(`${fileName},${label}`);

  fs.writeFileSync(csvPath, `${rows.join("\n")}\n`);
};

const removeLabelArtifacts = (filePath) => {
  const folderPath = path.dirname(filePath);
  const fileName = getFileNameWithoutExtension(filePath);
  const txtPath = path.join(folderPath, `${fileName}.txt`);
  const csvPath = path.join(folderPath, "labels.csv");

  try {
    fs.unlinkSync(txtPath);
  } catch {}

  if (!fs.existsSync(csvPath)) return;

  const rows = fs
    .readFileSync(csvPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .filter((row) => row.split(",")[0] !== fileName);

  if (rows.length > 0) {
    fs.writeFileSync(csvPath, `${rows.join("\n")}\n`);
    return;
  }

  try {
    fs.unlinkSync(csvPath);
  } catch {}
};

const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    const filePath = typeof file === "string" ? file : file?.path;

    if (!filePath) return;

    try {
      fs.unlinkSync(filePath);
    } catch {}
  });
};

const moveTaskFileToAssignedDirectory = (file, assignedTo) => {
  const destination = ensureDirectory(getUploadDirectory(assignedTo));
  const nextPath = path.join(destination, path.basename(file.path));

  fs.renameSync(file.path, nextPath);

  return {
    ...file,
    destination,
    path: nextPath,
    filename: path.basename(nextPath),
  };
};

const resolveWithinBaseDirectory = (filePath, baseDirectory) => {
  const resolvedBaseDirectory = path.resolve(baseDirectory);
  const resolvedPath = path.resolve(filePath);

  if (
    resolvedPath !== resolvedBaseDirectory &&
    !resolvedPath.startsWith(`${resolvedBaseDirectory}${path.sep}`)
  ) {
    throw new Unauthorized("Invalid file path");
  }

  if (
    resolvedPath !== uploadsRoot &&
    !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    throw new Unauthorized("Invalid upload path");
  }

  return resolvedPath;
};

export const uploadGenericFiles = async (request, response) => {
  genericFsMultiUpload(request, response, async (error) => {
    try {
      if (error) throw error;

      return response.json((request.files || []).map(serializeUpload));
    } catch (err) {
      return response
        .status(err?.status || 500)
        .json({ success: false, message: err.toString() });
    }
  });
};

export const deleteGenericFiles = async (request, response) => {
  const deleteds = Array.isArray(request.body?.deleteds) ? request.body.deleteds : [];
  const baseDirectory = getGenericUploadDirectory(request.params.rootId);

  deleteds.forEach((fileId) => {
    try {
      fs.unlinkSync(resolveWithinBaseDirectory(fileId, baseDirectory));
    } catch {}
  });

  return response.json({ deleted: deleteds });
};

export const uploadFiles = async (request, response) => {
  taskFsMultiUpload(request, response, async (error) => {
    let files = request.files || [];
    let createdItems = [];

    try {
      if (error) throw error;

      await attachAssignedLabeler(request);
      await attachAssignedJob(request);

      files = files.map((file) =>
        moveTaskFileToAssignedDirectory(file, request.assignedLabeler._id.toString())
      );

      for (const file of files) {
        createdItems.push(await fileProcessor(file, request));
      }

      return response.json(createdItems);
    } catch (err) {
      cleanupUploadedFiles(files);

      if (createdItems.length > 0) {
        await File.deleteMany({
          _id: {
            $in: createdItems.map((item) => item._id),
          },
        });
      }

      return response
        .status(err?.status || 500)
        .json({ success: false, message: err.toString() });
    }
  });
};

export const tableFiles = async (request, response) => {
  const { body, user } = request;

  const scope = getFileScope(user);

  return response.json(
    await table(
      File,
      {
        ...body,
        find: {
          ...(body?.find || {}),
          ...scope,
        },
      },
      {
        chain: (base) =>
          base.populate([
            "assignedTo",
            "job",
            "root",
            "createdby",
            "labeledBy",
            "approvedBy",
            "declinedBy",
            "deletedBy",
          ]),
      }
    )
  );
};

export const progressFiles = async (request, response) => {
  const jobId = request.query?.jobId;
  let selectedJob = null;

  if (jobId) {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new Exception("jobId буруу утга байна");
    }

    selectedJob = await Job.findById(jobId).select("_id name description created").lean();

    if (!selectedJob) {
      throw new Exception("Job олдсонгүй");
    }
  }

  const labelers = await User.find({ role: "labeler" })
    .sort({ username: 1 })
    .select("_id username firstname lastname")
    .lean();

  const progressRows = await File.aggregate([
    {
      $match: {
        assignedTo: { $ne: null },
        status: { $ne: "deleted" },
        ...(selectedJob ? { job: selectedJob._id } : {}),
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        uploaded: {
          $sum: {
            $cond: [{ $eq: ["$status", "uploaded"] }, 1, 0],
          },
        },
        labeled: {
          $sum: {
            $cond: [{ $eq: ["$status", "labeled"] }, 1, 0],
          },
        },
        approved: {
          $sum: {
            $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
          },
        },
        lastUploadedAt: { $max: "$created" },
        firstLabeledAt: {
          $min: {
            $cond: [
              { $ifNull: ["$labeledAt", false] },
              "$labeledAt",
              MAX_DATE_SENTINEL,
            ],
          },
        },
        lastLabeledAt: { $max: "$labeledAt" },
        firstApprovedAt: {
          $min: {
            $cond: [
              { $ifNull: ["$approvedAt", false] },
              "$approvedAt",
              MAX_DATE_SENTINEL,
            ],
          },
        },
        lastApprovedAt: { $max: "$approvedAt" },
      },
    },
  ]);

  const progressByLabelerId = progressRows.reduce((accumulator, row) => {
    accumulator[row._id?.toString()] = row;
    return accumulator;
  }, {});

  const items = labelers.map((labeler) => {
    const progress = progressByLabelerId[labeler._id.toString()] || {};
    const total = Number(progress.total || 0);
    const uploaded = Number(progress.uploaded || 0);
    const labeled = Number(progress.labeled || 0);
    const approved = Number(progress.approved || 0);

    return {
      labeler,
      total,
      uploaded,
      labeled,
      approved,
      completionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      reviewRate:
        total > 0 ? Math.round(((labeled + approved) / total) * 100) : 0,
      lastUploadedAt: progress.lastUploadedAt || null,
      firstLabeledAt:
        progress.firstLabeledAt &&
        progress.firstLabeledAt.getTime() !== MAX_DATE_SENTINEL.getTime()
          ? progress.firstLabeledAt
          : null,
      lastLabeledAt: progress.lastLabeledAt || null,
      firstApprovedAt:
        progress.firstApprovedAt &&
        progress.firstApprovedAt.getTime() !== MAX_DATE_SENTINEL.getTime()
          ? progress.firstApprovedAt
          : null,
      lastApprovedAt: progress.lastApprovedAt || null,
    };
  });

  const summary = items.reduce(
    (accumulator, item) => {
      accumulator.total += item.total;
      accumulator.uploaded += item.uploaded;
      accumulator.labeled += item.labeled;
      accumulator.approved += item.approved;
      return accumulator;
    },
    {
      labelers: items.length,
      total: 0,
      uploaded: 0,
      labeled: 0,
      approved: 0,
    }
  );

  return response.json({
    job: selectedJob,
    summary: {
      ...summary,
      completionRate:
        summary.total > 0 ? Math.round((summary.approved / summary.total) * 100) : 0,
      reviewRate:
        summary.total > 0
          ? Math.round(((summary.labeled + summary.approved) / summary.total) * 100)
          : 0,
    },
    items,
  });
};

export const labelFile = async (request, response) => {
  const rawLabel = request.body?.label;
  const label =
    typeof rawLabel === "string" ? rawLabel.trim().toUpperCase() : "";

  if (!label) {
    throw new Exception("label утга оруулах шаардлагатай");
  }

  const file = await getAccessibleFileById(request.params.id, request.user);

  if (!["uploaded", "labeled"].includes(file.status)) {
    throw new Exception("Pending image not found");
  }

  file.root = null;
  file.label = label;
  file.status = "labeled";
  file.labeledBy = request.user?.id;
  file.labeledAt = new Date();
  file.approvedBy = null;
  file.approvedAt = null;
  file.declinedBy = null;
  file.declinedAt = null;
  file.deletedBy = null;
  file.deletedAt = null;
  file.modified = new Date();
  file.modifiedby = request.user?.id;

  await file.save();
  removeLabelArtifacts(file.id);

  return response.json(
    await File.findById(file._id)
      .populate([
        "assignedTo",
        "job",
        "root",
        "createdby",
        "labeledBy",
        "approvedBy",
        "declinedBy",
        "deletedBy",
      ])
      .lean()
  );
};

export const approveFile = async (request, response) => {
  const rawLabel = request.body?.label;
  const label =
    typeof rawLabel === "string" ? rawLabel.trim().toUpperCase() : "";

  if (!label) {
    throw new Exception("label утга оруулах шаардлагатай");
  }

  const file = await getAccessibleFileById(request.params.id, request.user);

  if (file.status !== "labeled") {
    throw new Exception("Pending labeled image not found");
  }

  file.root = null;
  file.label = label;
  file.status = "approved";
  file.approvedBy = request.user?.id;
  file.approvedAt = new Date();
  file.declinedBy = null;
  file.declinedAt = null;
  file.deletedBy = null;
  file.deletedAt = null;
  file.modified = new Date();
  file.modifiedby = request.user?.id;

  await file.save();
  syncLabelArtifacts(file.id, label);

  return response.json(
    await File.findById(file._id)
      .populate([
        "assignedTo",
        "job",
        "root",
        "createdby",
        "labeledBy",
        "approvedBy",
        "declinedBy",
        "deletedBy",
      ])
      .lean()
  );
};

export const declineFile = async (request, response) => {
  const file = await getAccessibleFileById(request.params.id, request.user);

  if (file.status !== "labeled") {
    throw new Exception("Pending labeled image not found");
  }

  const rawLabel = request.body?.label;
  const label =
    typeof rawLabel === "string" && rawLabel.trim()
      ? rawLabel.trim().toUpperCase()
      : file.label || "";

  file.label = label;
  file.status = "uploaded";
  file.approvedBy = null;
  file.approvedAt = null;
  file.declinedBy = request.user?.id;
  file.declinedAt = new Date();
  file.deletedBy = null;
  file.deletedAt = null;
  file.modified = new Date();
  file.modifiedby = request.user?.id;

  await file.save();
  removeLabelArtifacts(file.id);

  return response.json(
    await File.findById(file._id)
      .populate([
        "assignedTo",
        "job",
        "root",
        "createdby",
        "labeledBy",
        "approvedBy",
        "declinedBy",
        "deletedBy",
      ])
      .lean()
  );
};

export const trashFile = async (request, response) => {
  const file = await getAccessibleFileById(request.params.id, request.user);

  if (!["uploaded", "labeled"].includes(file.status)) {
    throw new Exception("Only uploaded or submitted images can be moved to trash");
  }

  file.status = "deleted";
  file.deletedBy = request.user?.id;
  file.deletedAt = new Date();
  file.modified = new Date();
  file.modifiedby = request.user?.id;

  await file.save();
  removeLabelArtifacts(file.id);

  return response.json(
    await File.findById(file._id)
      .populate([
        "assignedTo",
        "job",
        "root",
        "createdby",
        "labeledBy",
        "approvedBy",
        "declinedBy",
        "deletedBy",
      ])
      .lean()
  );
};

export const deleteFile = async (request, response) => {
  const file = await getAccessibleFileById(request.params.id, request.user);

  try {
    fs.unlinkSync(file.id);
  } catch {}

  removeLabelArtifacts(file.id);

  await File.deleteOne({ _id: file._id });

  return response.json({ deleted: file._id });
};
