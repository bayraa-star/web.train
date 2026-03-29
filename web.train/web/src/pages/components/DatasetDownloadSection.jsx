import { useEffect, useMemo, useState } from "react";
import { mainApi } from "../../providers/api";
import { errorAlert } from "../../providers/alert";
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

const DatasetDownloadSection = () => {
  const [scope, setScope] = useState(DATASET_OPTIONS[0].value);
  const [exportJob, setExportJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scopeMeta =
    DATASET_OPTIONS.find((option) => option.value === scope) || DATASET_OPTIONS[0];

  const downloadHref = useMemo(() => {
    if (!exportJob?.downloadPath) {
      return "";
    }

    return getAbsolutePath({ id: exportJob.downloadPath });
  }, [exportJob]);

  const fetchStatus = async (jobId, { silent = false } = {}) => {
    try {
      const response = await mainApi({
        url: `/dataset/export/${jobId}`,
        method: "GET",
      });

      setExportJob(response?.data || null);
      setError("");
    } catch (err) {
      setError(err);

      if (!silent) {
        await errorAlert("action.error", err);
      }
    }
  };

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
  }, [exportJob?._id, exportJob?.status]);

  const startExport = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await mainApi({
        url: "/dataset/export",
        method: "POST",
        data: {
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

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Download Dataset</div>
      <div className="mt-1 text-sm text-gray-500">
        Build the dataset zip on the server, poll progress from the browser,
        and download it only after the archive is ready.
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
        disabled={loading || (exportJob && !["finished", "error"].includes(exportJob.status))}
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
    </div>
  );
};

export default DatasetDownloadSection;
