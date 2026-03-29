import fs from "fs";
import path from "path";

import Job from "../models/job";
import File from "../models/file";
import { UPLOADS_ROOT } from "../consts";
import { table } from "../utils/db";
import { Exception, Unauthorized } from "../utils";

const PUBLIC_UPLOADS_DIR = "uploads";
const uploadsRoot = path.resolve(UPLOADS_ROOT);

const normalizePublicUploadId = (value = "") => {
  return value.toString().replace(/\\/g, "/").replace(/^\/+/, "");
};

const ensurePathInsideUploadsRoot = (filePath) => {
  const resolvedPath = path.resolve(filePath);

  if (
    resolvedPath !== uploadsRoot &&
    !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    throw new Unauthorized("Invalid upload path");
  }

  return resolvedPath;
};

const toAbsoluteUploadPath = (uploadId = "") => {
  const normalizedUploadId = normalizePublicUploadId(uploadId);
  const relativePath = normalizedUploadId.startsWith(`${PUBLIC_UPLOADS_DIR}/`)
    ? normalizedUploadId.slice(PUBLIC_UPLOADS_DIR.length + 1)
    : normalizedUploadId === PUBLIC_UPLOADS_DIR
      ? ""
      : normalizedUploadId;

  return ensurePathInsideUploadsRoot(path.join(uploadsRoot, relativePath));
};

const getFileNameWithoutExtension = (filePath = "") => {
  return path.parse(filePath).name;
};

const cleanupEmptyParentDirectories = (startDirectory) => {
  let currentDirectory = path.resolve(startDirectory);

  while (
    currentDirectory !== uploadsRoot &&
    currentDirectory.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    try {
      if (fs.readdirSync(currentDirectory).length > 0) {
        return;
      }

      fs.rmdirSync(currentDirectory);
      currentDirectory = path.dirname(currentDirectory);
    } catch {
      return;
    }
  }
};

const removeLabelArtifacts = (fileId) => {
  const absoluteFilePath = toAbsoluteUploadPath(fileId);
  const folderPath = path.dirname(absoluteFilePath);
  const fileName = getFileNameWithoutExtension(absoluteFilePath);
  const txtPath = path.join(folderPath, `${fileName}.txt`);
  const csvPath = path.join(folderPath, "labels.csv");

  try {
    fs.unlinkSync(txtPath);
  } catch {}

  if (fs.existsSync(csvPath)) {
    const rows = fs
      .readFileSync(csvPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .filter((row) => row.split(",")[0] !== fileName);

    if (rows.length > 0) {
      fs.writeFileSync(csvPath, `${rows.join("\n")}\n`);
    } else {
      try {
        fs.unlinkSync(csvPath);
      } catch {}
    }
  }

  cleanupEmptyParentDirectories(folderPath);
};

const deletePhysicalFile = (fileId) => {
  const absoluteFilePath = toAbsoluteUploadPath(fileId);
  const folderPath = path.dirname(absoluteFilePath);

  try {
    fs.unlinkSync(absoluteFilePath);
  } catch {}

  removeLabelArtifacts(fileId);
  cleanupEmptyParentDirectories(folderPath);
};

const getLabelerAssignedJobIds = async (userId) => {
  if (!userId) {
    return [];
  }

  return File.distinct("job", {
    assignedTo: userId,
    job: { $ne: null },
    status: { $ne: "deleted" },
  });
};

const getJobScope = async (request) => {
  if (request?.user?.role !== "labeler") {
    return {};
  }

  const jobIds = await getLabelerAssignedJobIds(request.user.id);

  return {
    _id: {
      $in: jobIds,
    },
  };
};

export const getAccessibleJobById = (id) => {
  return Job.findOne({
    _id: id,
  });
};

export const getJobById = (request) => {
  return getAccessibleJobById(request.params.id);
};

export const addJob = (request) => {
  const job = new Job(request.body);

  return job.save();
};

export const updateJobById = (request) => {
  return Job.findOneAndUpdate(
    {
      _id: request.params.id,
    },
    request.body,
    { new: true }
  );
};

export const deleteJobById = async (request) => {
  const linkedFiles = await File.find({
    job: request.params.id,
  })
    .select("_id id")
    .lean();

  linkedFiles.forEach((file) => {
    if (!file?.id) {
      return;
    }

    deletePhysicalFile(file.id);
  });

  if (linkedFiles.length > 0) {
    await File.deleteMany({
      _id: {
        $in: linkedFiles.map((file) => file._id),
      },
    });
  }

  await Job.deleteOne({
    _id: request.params.id,
  });

  return {
    deleted: request.params.id,
    filesDeleted: linkedFiles.length,
  };
};

export const getJobTable = async (request) => {
  const { body } = request;
  const scope = await getJobScope(request);

  return table(
    Job,
    {
      ...body,
      find: {
        ...(body?.find || {}),
        ...scope,
      },
    },
    {
      chain: (base) => base,
    }
  );
};
