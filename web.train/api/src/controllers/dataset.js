import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { mkdirp } from "mkdirp";
import { v4 as uuid } from "uuid";

import File from "../models/file";
import DatasetExport from "../models/datasetExport";
import Job from "../models/job";
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

const toAbsoluteExportPath = (fileName = "") => {
  const normalizedFileName = path.basename(fileName.toString().trim());

  if (!normalizedFileName || normalizedFileName !== fileName) {
    throw new Exception("Invalid export file");
  }

  return ensurePathInsideUploadsRoot(path.join(exportsRoot, normalizedFileName));
};

const getScopeFromFileName = (fileName = "") => {
  const match = fileName.match(/^dataset-(approved|all)-/);

  return match?.[1] || "";
};

const getTaskLabel = (taskType = "ocr") => {
  if (taskType === "ocr_detection") return "ocr-detection";
  if (taskType === "detection") return "detection";
  return "ocr";
};

const slugify = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "job";
};

const getDatasetScope = (scope, jobId) => {
  const baseScope = {
    job: jobId,
  };

  if (scope === "approved") {
    return {
      ...baseScope,
      status: "approved",
    };
  }

  if (scope === "all") {
    return {
      ...baseScope,
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

const writeClassesFile = (directory, classes = []) => {
  if (!Array.isArray(classes) || classes.length < 1) {
    return;
  }

  fs.writeFileSync(path.join(directory, "classes.txt"), `${classes.join("\n")}\n`);
};

const toYoloLine = (annotation, classIndexByName) => {
  const classIndex = classIndexByName[annotation?.className];

  if (classIndex === undefined) {
    return "";
  }

  const x = Number(annotation?.x || 0);
  const y = Number(annotation?.y || 0);
  const width = Number(annotation?.width || 0);
  const height = Number(annotation?.height || 0);

  if (width <= 0 || height <= 0) {
    return "";
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return [
    classIndex,
    centerX.toFixed(6),
    centerY.toFixed(6),
    width.toFixed(6),
    height.toFixed(6),
  ].join(" ");
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

    const job = await Job.findById(exportJob.job).select("classes taskType").lean();
    const classList = Array.isArray(job?.classes) ? job.classes.filter(Boolean) : [];
    const classIndexByName = classList.reduce((accumulator, className, index) => {
      accumulator[className] = index;
      return accumulator;
    }, {});

    const files = await File.find(getDatasetScope(exportJob.scope, exportJob.job))
      .sort({ _id: 1 })
      .select("id label ocrText status taskType annotations")
      .lean();

    if (files.length < 1) {
      throw new Exception("No files found for the selected dataset scope");
    }

    mkdirp.sync(exportsRoot);

    const archiveFileName = `dataset-${slugify(exportJob.jobName)}-${getTaskLabel(
      exportJob.taskType
    )}-${exportJob.scope}-${new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14)}-${exportId.slice(-8)}.zip`;

    tempDirectory = path.join(exportsRoot, `tmp-${exportId}`);
    zipPath = path.join(exportsRoot, archiveFileName);

    cleanupExportArtifacts(tempDirectory, zipPath);
    mkdirp.sync(tempDirectory);
    writeClassesFile(tempDirectory, classList);

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

      if (file.status === "approved" && exportJob.taskType === "ocr" && file.label) {
        const fileName = path.parse(destinationPath).name;
        fs.writeFileSync(
          path.join(destinationDirectory, `${fileName}.txt`),
          file.label
        );

        const rows = labelsByDirectory.get(destinationDirectory) || [];
        rows.push(`${fileName},${file.label}`);
        labelsByDirectory.set(destinationDirectory, rows);
      }

      if (
        file.status === "approved" &&
        ["detection", "ocr_detection"].includes(exportJob.taskType)
      ) {
        const fileName = path.parse(destinationPath).name;
        const yoloLines = (Array.isArray(file.annotations) ? file.annotations : [])
          .map((annotation) => toYoloLine(annotation, classIndexByName))
          .filter(Boolean);

        if (yoloLines.length > 0) {
          fs.writeFileSync(
            path.join(destinationDirectory, `${fileName}.txt`),
            `${yoloLines.join("\n")}\n`
          );
        }

        if (exportJob.taskType === "ocr_detection") {
          const ocrValue = file.ocrText || file.label || "";

          if (ocrValue) {
            fs.writeFileSync(
              path.join(destinationDirectory, `${fileName}.ocr.txt`),
              `${ocrValue}\n`
            );
          }
        }
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
  const jobId = request.body?.jobId;

  if (!jobId) {
    throw new Exception("jobId утга оруулах шаардлагатай");
  }

  getDatasetScope(scope, jobId);

  const job = await Job.findById(jobId).select("_id name taskType").lean();

  if (!job) {
    throw new Exception("Job олдсонгүй");
  }

  const exportJob = await new DatasetExport({
    job: job._id,
    jobName: job.name,
    taskType: job.taskType || "ocr",
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

export const listDatasetExports = async (request, response) => {
  mkdirp.sync(exportsRoot);

  const fileNames = fs.existsSync(exportsRoot)
    ? fs
        .readdirSync(exportsRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".zip"))
        .map((entry) => entry.name)
    : [];

  const exportJobs = await DatasetExport.find({
    fileName: {
      $in: fileNames,
    },
  })
    .select(
      "_id job jobName taskType scope status progress message downloadPath fileName created finishedAt"
    )
    .lean();

  const exportByFileName = exportJobs.reduce((accumulator, item) => {
    accumulator[item.fileName] = item;
    return accumulator;
  }, {});

  const items = fileNames
    .map((fileName) => {
      const absolutePath = toAbsoluteExportPath(fileName);
      const stats = fs.statSync(absolutePath);
      const exportJob = exportByFileName[fileName];

      return {
        _id: exportJob?._id || null,
        fileName,
        job: exportJob?.job || null,
        jobName: exportJob?.jobName || "-",
        taskType: exportJob?.taskType || "ocr",
        scope: exportJob?.scope || getScopeFromFileName(fileName) || "approved",
        status: exportJob?.status || "finished",
        progress: exportJob?.progress || 100,
        message: exportJob?.message || "Dataset zip is ready.",
        created: exportJob?.created || stats.birthtime || stats.mtime,
        finishedAt: exportJob?.finishedAt || stats.mtime,
        size: stats.size,
        downloadPath: exportJob?.downloadPath || toPublicExportPath(fileName),
      };
    })
    .sort((left, right) => {
      return (
        new Date(right.finishedAt || right.created || 0).getTime() -
        new Date(left.finishedAt || left.created || 0).getTime()
      );
    });

  return response.json({
    items,
  });
};

export const getDatasetExportStatus = async (request, response) => {
  const exportJob = await DatasetExport.findById(request.params.id).lean();

  if (!exportJob) {
    throw new Exception("Dataset export not found");
  }

  return response.json(exportJob);
};

export const deleteDatasetExport = async (request, response) => {
  const fileName = path.basename(request.params.fileName || "");

  if (!fileName || fileName !== request.params.fileName || !fileName.endsWith(".zip")) {
    throw new Exception("Invalid export file");
  }

  const absolutePath = toAbsoluteExportPath(fileName);

  if (!fs.existsSync(absolutePath)) {
    throw new Exception("Dataset export file not found");
  }

  fs.unlinkSync(absolutePath);
  await DatasetExport.deleteMany({ fileName });

  return response.json({
    deleted: fileName,
  });
};
