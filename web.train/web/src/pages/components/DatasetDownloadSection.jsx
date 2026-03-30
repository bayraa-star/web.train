import { useEffect, useMemo, useState } from "react";
import { mainApi } from "../../providers/api";
import {
  confirmPopup,
  errorAlert,
  successAlert,
} from "../../providers/alert";
import { getAbsolutePath } from "../../providers/format";
import ProgressBar from "../../template/Progress";

const DATASET_OPTIONS = [
  {
    value: "approved",
    label: "Labeled Only",
    description: "Export only examiner-approved images and annotation files.",
  },
  {
    value: "all",
    label: "All Dataset",
    description: "Export uploaded, submitted, and approved images. Deleted items are excluded.",
  },
];

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const formatFileSize = (value) => {
  const size = Number(value || 0);

  if (size < 1) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const DatasetDownloadSection = () => {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [scope, setScope] = useState(DATASET_OPTIONS[0].value);
  const [exportJob, setExportJob] = useState(null);
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scopeMeta =
    DATASET_OPTIONS.find((option) => option.value === scope) || DATASET_OPTIONS[0];

  const getTaskLabel = (taskType) => {
    if (taskType === "ocr_detection") return "OCR + Detection";
    if (taskType === "detection") return "Detection";
    return "OCR";
  };

  const downloadHref = useMemo(() => {
    if (!exportJob?.downloadPath) {
      return "";
    }

    return getAbsolutePath({ id: exportJob.downloadPath });
  }, [exportJob]);

  const fetchArchives = async ({ silent = false } = {}) => {
    if (!silent) {
      setArchivesLoading(true);
    }

    try {
      const response = await mainApi({
        url: "/dataset/export",
        method: "GET",
      });

      setArchives(response?.data?.items || []);
      setError("");
    } catch (err) {
      setArchives([]);
      setError(err);

      if (!silent) {
        await errorAlert("action.error", err);
      }
    } finally {
      if (!silent) {
        setArchivesLoading(false);
      }
    }
  };

  const fetchStatus = async (jobId, { silent = false } = {}) => {
    try {
      const response = await mainApi({
        url: `/dataset/export/${jobId}`,
        method: "GET",
      });

      const nextExportJob = response?.data || null;

      setExportJob(nextExportJob);
      setError("");

      if (nextExportJob?.status === "finished") {
        await fetchArchives({ silent: true });
      }
    } catch (err) {
      setError(err);

      if (!silent) {
        await errorAlert("action.error", err);
      }
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await mainApi({
          url: "/job/table",
          method: "POST",
          data: {
            limit: 200,
            sort: {
              created: -1,
            },
          },
        });

        const nextJobs = response?.data?.items || [];
        setJobs(nextJobs);
        setJobId((previous) => {
          if (previous && nextJobs.some((item) => item._id === previous)) {
            return previous;
          }

          return nextJobs?.[0]?._id || "";
        });
      } catch (err) {
        setJobs([]);
        setJobId("");
        setError(err);
      }
    };

    fetchJobs();
    fetchArchives({ silent: true });
  }, []);

  useEffect(() => {
    if (!exportJob?._id) {
      return undefined;
    }

    if (["finished", "error"].includes(exportJob.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      fetchStatus(exportJob._id, { silent: true });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportJob?._id, exportJob?.status]);

  const startExport = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await mainApi({
        url: "/dataset/export",
        method: "POST",
        data: {
          jobId,
          scope,
        },
      });

      setExportJob(response?.data || null);
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteArchive = async (archive) => {
    const confirmed = await confirmPopup(
      `Delete ${archive.fileName}? This removes the zip file from server storage.`
    );

    if (!confirmed?.isConfirmed) {
      return;
    }

    setDeletingFileName(archive.fileName);
    setError("");

    try {
      await mainApi({
        url: `/dataset/export/${encodeURIComponent(archive.fileName)}`,
        method: "DELETE",
      });

      setArchives((previous) =>
        previous.filter((item) => item.fileName !== archive.fileName)
      );
      setExportJob((previous) =>
        previous?.fileName === archive.fileName
          ? { ...previous, downloadPath: "" }
          : previous
      );
      await successAlert("action.success", "Dataset zip deleted successfully.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setDeletingFileName("");
    }
  };

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Download Dataset</div>
      <div className="mt-1 text-sm text-gray-500">
        Build the dataset zip on the server, poll progress from the browser,
        and download it only after the archive is ready.
      </div>

      <div className="mt-4 flex flex-col gap-2 md:max-w-md">
        <div className="text-sm font-medium">Job</div>
        <select
          value={jobId}
          onChange={(event) => setJobId(event.target.value)}
          disabled={loading || (exportJob && !["finished", "error"].includes(exportJob.status))}
          className="border rounded px-3 py-2"
        >
          <option value="">Select job</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.name} ({getTaskLabel(job.taskType)})
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500">
          Export only the images and labels that belong to the selected job.
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 md:max-w-md">
        <div className="text-sm font-medium">Dataset Scope</div>
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          disabled={loading || (exportJob && !["finished", "error"].includes(exportJob.status))}
          className="border rounded px-3 py-2"
        >
          {DATASET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500">{scopeMeta.description}</div>
      </div>

      <button
        type="button"
        onClick={startExport}
        disabled={
          !jobId || loading || (exportJob && !["finished", "error"].includes(exportJob.status))
        }
        className="!w-auto mt-4 border px-6 py-2 rounded inline-flex disabled:opacity-50"
      >
        {loading
          ? "Starting..."
          : exportJob && !["finished", "error"].includes(exportJob.status)
            ? "Export Running..."
            : "Start Export"}
      </button>

      {error ? <div className="mt-3 text-sm text-red-500">{error}</div> : null}

      {exportJob ? (
        <div className="mt-6 rounded border bg-gray-50 p-4">
          <div className="text-sm font-medium">Export Status</div>
          <div className="mt-2 text-sm text-gray-600">
            Job: {exportJob.jobName || "-"}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Label Type: {getTaskLabel(exportJob.taskType)}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Scope:{" "}
            {DATASET_OPTIONS.find((option) => option.value === exportJob.scope)?.label ||
              exportJob.scope}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Status: {exportJob.status}
          </div>
          <div className="mt-1 text-sm text-gray-600">{exportJob.message || "-"}</div>

          <div className="mt-4">
            <ProgressBar progress={Number(exportJob.progress || 0)} pulse />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
            <div>{`Files: ${exportJob.processedFiles || 0} / ${exportJob.totalFiles || 0}`}</div>
            <div>{`Zip entries: ${exportJob.zippedEntries || 0} / ${exportJob.totalEntries || 0}`}</div>
            <div>{`Created: ${formatDateTime(exportJob.created)}`}</div>
            <div>{`Finished: ${formatDateTime(exportJob.finishedAt)}`}</div>
          </div>

          {exportJob.status === "finished" && downloadHref ? (
            <a
              href={downloadHref}
              className="!w-auto mt-4 inline-flex rounded border px-6 py-2"
              download
            >
              Download ZIP
            </a>
          ) : null}

          {exportJob.status === "error" ? (
            <div className="mt-4 text-sm text-red-500">
              {exportJob.error || "Dataset export failed."}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Available ZIP Files</div>
            <div className="mt-1 text-sm text-gray-500">
              All generated dataset archives currently stored on the server.
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchArchives()}
            disabled={archivesLoading || !!deletingFileName}
            className="!w-auto border px-4 py-2 rounded inline-flex disabled:opacity-50"
          >
            {archivesLoading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {archivesLoading ? (
          <div className="mt-4 text-sm text-gray-500">Loading zip files...</div>
        ) : archives.length < 1 ? (
          <div className="mt-4 text-sm text-gray-500">No dataset zip files found.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="px-3 py-3 font-medium">File</th>
                  <th className="px-3 py-3 font-medium">Job</th>
                  <th className="px-3 py-3 font-medium">Label Type</th>
                  <th className="px-3 py-3 font-medium">Scope</th>
                  <th className="px-3 py-3 font-medium">Size</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Finished</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr key={archive.fileName} className="border-b align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium">{archive.fileName}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {archive.jobName || "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {getTaskLabel(archive.taskType)}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {DATASET_OPTIONS.find((option) => option.value === archive.scope)
                        ?.label || archive.scope}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {formatFileSize(archive.size)}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {formatDateTime(archive.created)}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {formatDateTime(archive.finishedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={getAbsolutePath({ id: archive.downloadPath })}
                          className="!w-auto inline-flex rounded border px-4 py-2"
                          download
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteArchive(archive)}
                          disabled={deletingFileName === archive.fileName}
                          className="!w-auto inline-flex rounded border border-red-600 bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                        >
                          {deletingFileName === archive.fileName
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetDownloadSection;
