import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { mkdirp } from "mkdirp";
import { v4 as uuid } from "uuid";

import File from "../models/file";
import DatasetExport from "../models/datasetExport";
import { UPLOADS_ROOT } from "../consts";
import { Exception } from "../utils";

const PUBLIC_UPLOADS_DIR = "uploads";
const uploadsRoot = path.resolve(UPLOADS_ROOT);
const exportsRoot = path.join(uploadsRoot, "exports");
const ACTIVE_DATASET_STATUSES = ["uploaded", "labeled", "approved"];

const normalizePublicUploadId = (value = "") => {
  return value.toString().replace(/\\/g, "/").replace(/^\/+/, "");
};

const ensurePathInsideUploadsRoot = (filePath) => {
  const resolvedPath = path.resolve(filePath);

  if (
    resolvedPath !== uploadsRoot &&
    !resolvedPath.startsWith(`${uploadsRoot}${path.sep}`)
  ) {
    throw new Exception("Invalid upload path");
  }

  return resolvedPath;
};

const toRelativeUploadPath = (uploadId = "") => {
  const normalizedUploadId = normalizePublicUploadId(uploadId);

  if (normalizedUploadId.startsWith(`${PUBLIC_UPLOADS_DIR}/`)) {
    return normalizedUploadId.slice(PUBLIC_UPLOADS_DIR.length + 1);
  }

  if (normalizedUploadId === PUBLIC_UPLOADS_DIR) {
    return "";
  }

  return normalizedUploadId;
};

const toAbsoluteUploadPath = (uploadId = "") => {
  return ensurePathInsideUploadsRoot(
    path.join(uploadsRoot, toRelativeUploadPath(uploadId))
  );
};

const toPublicExportPath = (fileName) => {
  return path.posix.join(PUBLIC_UPLOADS_DIR, "exports", fileName);
};

const getDatasetScope = (scope) => {
  if (scope === "approved") {
    return {
      status: "approved",
    };
  }

  if (scope === "all") {
    return {
      status: {
        $in: ACTIVE_DATASET_STATUSES,
      },
    };
  }

  throw new Exception("scope буруу утга байна");
};

const countFilesRecursive = (directory) => {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  return fs.readdirSync(directory, { withFileTypes: true }).reduce(
    (total, entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return total + countFilesRecursive(entryPath);
      }

      return total + 1;
    },
    0
  );
};

const cleanupExportArtifacts = (tempDirectory, zipPath) => {
  if (tempDirectory) {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }

  if (zipPath && fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
};

const writeLabelsCsvFiles = (labelsByDirectory) => {
  labelsByDirectory.forEach((rows, directory) => {
    fs.writeFileSync(path.join(directory, "labels.csv"), `${rows.join("\n")}\n`);
  });
};

const zipDirectory = (sourceDirectory, outputPath, totalEntries, onProgress) => {
  return new Promise((resolve, reject) => {
    const zipProcess = spawn("zip", ["-rD", outputPath, "."], {
      cwd: sourceDirectory,
    });

    let zippedEntries = 0;
    const parseChunk = (chunk) => {
      chunk
        .toString()
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => {
          if (!line.includes("adding: ")) {
            return;
          }

          zippedEntries += 1;
          onProgress(zippedEntries, totalEntries);
        });
    };

    zipProcess.stdout.on("data", parseChunk);
    zipProcess.stderr.on("data", parseChunk);
    zipProcess.on("error", reject);
    zipProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Exception(`zip process failed with code ${code}`));
        return;
      }

      resolve();
    });
  });
};

const updateExport = (exportId, payload) => {
  return DatasetExport.findByIdAndUpdate(
    exportId,
    {
      ...payload,
      modified: new Date(),
    },
    { new: true }
  );
};

const runDatasetExport = async (exportId) => {
  let tempDirectory = "";
  let zipPath = "";

  try {
    const exportJob = await DatasetExport.findById(exportId).lean();

    if (!exportJob) {
      return;
    }

    await updateExport(exportId, {
      status: "preparing",
      progress: 1,
      message: "Collecting dataset files...",
      error: "",
    });

    const files = await File.find(getDatasetScope(exportJob.scope))
      .sort({ _id: 1 })
      .select("id label status")
      .lean();

    if (files.length < 1) {
      throw new Exception("No files found for the selected dataset scope");
    }

    mkdirp.sync(exportsRoot);

    const archiveFileName = `dataset-${exportJob.scope}-${new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14)}-${exportId.slice(-8)}.zip`;

    tempDirectory = path.join(exportsRoot, `tmp-${exportId}`);
    zipPath = path.join(exportsRoot, archiveFileName);

    cleanupExportArtifacts(tempDirectory, zipPath);
    mkdirp.sync(tempDirectory);

    await updateExport(exportId, {
      status: "copying",
      progress: 5,
      totalFiles: files.length,
      processedFiles: 0,
      message: `Copying 0/${files.length} files...`,
    });

    const labelsByDirectory = new Map();

    for (const [index, file] of files.entries()) {
      const relativeUploadPath = toRelativeUploadPath(file.id);
      const sourcePath = toAbsoluteUploadPath(file.id);
      const destinationPath = path.join(
        tempDirectory,
        path.basename(relativeUploadPath)
      );
      const destinationDirectory = path.dirname(destinationPath);

      mkdirp.sync(destinationDirectory);
      fs.copyFileSync(sourcePath, destinationPath);

      if (file.status === "approved" && file.label) {
        const fileName = path.parse(destinationPath).name;
        fs.writeFileSync(
          path.join(destinationDirectory, `${fileName}.txt`),
          file.label
        );

        const rows = labelsByDirectory.get(destinationDirectory) || [];
        rows.push(`${fileName},${file.label}`);
        labelsByDirectory.set(destinationDirectory, rows);
      }

      const processedFiles = index + 1;

      if (processedFiles % 25 === 0 || processedFiles === files.length) {
        await updateExport(exportId, {
          processedFiles,
          progress: Math.min(
            70,
            5 + Math.round((processedFiles / files.length) * 65)
          ),
          message: `Copying ${processedFiles}/${files.length} files...`,
        });
      }
    }

    writeLabelsCsvFiles(labelsByDirectory);

    const totalEntries = countFilesRecursive(tempDirectory);

    await updateExport(exportId, {
      status: "zipping",
      totalEntries,
      zippedEntries: 0,
      progress: 75,
      message: `Zipping 0/${totalEntries} files...`,
    });

    await zipDirectory(tempDirectory, zipPath, totalEntries, async (zippedEntries) => {
      if (zippedEntries % 25 !== 0 && zippedEntries !== totalEntries) {
        return;
      }

      await updateExport(exportId, {
        zippedEntries,
        progress: Math.min(
          99,
          75 + Math.round((zippedEntries / Math.max(totalEntries, 1)) * 24)
        ),
        message: `Zipping ${zippedEntries}/${totalEntries} files...`,
      });
    });

    fs.rmSync(tempDirectory, { recursive: true, force: true });

    await updateExport(exportId, {
      status: "finished",
      progress: 100,
      message: "Dataset zip is ready.",
      finishedAt: new Date(),
      downloadPath: toPublicExportPath(archiveFileName),
      fileName: archiveFileName,
      zippedEntries: totalEntries,
    });
  } catch (error) {
    cleanupExportArtifacts(tempDirectory, zipPath);

    await updateExport(exportId, {
      status: "error",
      progress: 0,
      message: error?.message || error?.toString() || "Dataset export failed",
      error: error?.message || error?.toString() || "Dataset export failed",
      finishedAt: new Date(),
    });
  }
};

export const startDatasetExport = async (request, response) => {
  const scope = request.body?.scope || "approved";

  getDatasetScope(scope);

  const exportJob = await new DatasetExport({
    scope,
    status: "queued",
    progress: 0,
    message: "Queued",
    totalFiles: 0,
    processedFiles: 0,
    totalEntries: 0,
    zippedEntries: 0,
    downloadPath: "",
    fileName: "",
    error: "",
    createdby: request.user?.id,
  }).save();

  setTimeout(() => {
    runDatasetExport(exportJob._id.toString());
  }, 0);

  return response.json(exportJob);
};

export const getDatasetExportStatus = async (request, response) => {
  const exportJob = await DatasetExport.findById(request.params.id).lean();

  if (!exportJob) {
    throw new Exception("Dataset export not found");
  }

  return response.json(exportJob);
};
