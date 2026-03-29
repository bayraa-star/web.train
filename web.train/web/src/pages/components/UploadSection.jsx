import { useEffect, useState } from "react";
import { mainApi } from "../../providers/api";
import { errorAlert, successAlert } from "../../providers/alert";
import ProgressBar from "../../template/Progress";

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
};

const UploadSection = ({ onUploaded, refreshKey }) => {
  const [labelers, setLabelers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [jobId, setJobId] = useState("");
  const [newJobName, setNewJobName] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLoadedBytes, setUploadLoadedBytes] = useState(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      setError("");

      try {
        const [labelerResponse, jobResponse] = await Promise.all([
          mainApi({
            url: "/user/table",
            method: "POST",
            data: {
              find: {
                role: "labeler",
              },
              limit: 100,
            },
          }),
          mainApi({
            url: "/job/table",
            method: "POST",
            data: {
              limit: 100,
              sort: {
                created: -1,
              },
            },
          }),
        ]);

        const nextLabelers = labelerResponse?.data?.items || [];
        const nextJobs = jobResponse?.data?.items || [];

        setLabelers(nextLabelers);
        setAssignedTo((previous) => {
          if (previous && nextLabelers.some((item) => item._id === previous)) {
            return previous;
          }

          return nextLabelers?.[0]?._id || "";
        });
        setJobs(nextJobs);
        setJobId((previous) => {
          if (previous && nextJobs.some((item) => item._id === previous)) {
            return previous;
          }

          return nextJobs?.[0]?._id || "";
        });
      } catch (err) {
        setLabelers([]);
        setAssignedTo("");
        setJobs([]);
        setJobId("");
        setError(err);
      }
    };

    fetchOptions();
  }, [refreshKey]);

  const createJob = async () => {
    const name = newJobName.trim();

    if (!name) return;

    setCreatingJob(true);
    setError("");

    try {
      const response = await mainApi({
        url: "/job",
        method: "POST",
        data: {
          name,
        },
      });

      const createdJob = response?.data;

      if (createdJob?._id) {
        setJobs((previous) => [createdJob, ...previous.filter((item) => item._id !== createdJob._id)]);
        setJobId(createdJob._id);
        setNewJobName("");
        onUploaded && onUploaded();
        await successAlert("action.success", `Job "${createdJob.name}" created successfully.`);
      }
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setCreatingJob(false);
    }
  };

  const uploadFiles = async () => {
    if (!assignedTo || !jobId || files.length < 1) return;

    const data = new FormData();
    const totalUploadBytes = files.reduce((total, file) => total + (file.size || 0), 0);

    data.append("assignedTo", assignedTo);
    data.append("jobId", jobId);
    files.forEach((file) => data.append("upload", file));

    setLoading(true);
    setError("");
    setUploadProgress(0);
    setUploadLoadedBytes(0);
    setUploadTotalBytes(totalUploadBytes);

    try {
      await mainApi({
        url: "/file/upload",
        method: "POST",
        data,
        onUploadProgress: (event) => {
          const total = Number(event.total || 0);
          const loaded = Number(event.loaded || 0);

          setUploadLoadedBytes(loaded);
          if (total > 0) {
            setUploadTotalBytes(total);
            setUploadProgress(Math.round((loaded * 100) / total));
          }
        },
      });

      const uploadedCount = files.length;
      setFiles([]);
      setUploadProgress(100);
      setUploadLoadedBytes(totalUploadBytes);
      onUploaded && onUploaded();
      await successAlert("action.success", `${uploadedCount} image(s) uploaded successfully.`);
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadLoadedBytes(0);
        setUploadTotalBytes(0);
      }, 300);
    }
  };

  const totalSelectedBytes = files.reduce((total, file) => total + (file.size || 0), 0);
  const totalBytes = uploadTotalBytes || totalSelectedBytes;
  const remainingBytes = Math.max(totalBytes - uploadLoadedBytes, 0);

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Upload Images</div>
      <div className="text-sm text-gray-500 mt-1">
        Upload raw images and assign them to a labeler.
      </div>
      {error ? <div className="mt-2 text-sm text-red-500">{error}</div> : null}

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Job</div>
          <select
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select job</option>
            {jobs.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={newJobName}
              onChange={(event) => setNewJobName(event.target.value)}
              placeholder="Create new job, e.g. Batch 2026-03-29"
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              type="button"
              onClick={createJob}
              disabled={creatingJob || !newJobName.trim()}
              className="!w-auto self-start shrink-0 border px-4 py-2 rounded inline-flex disabled:opacity-50 md:self-auto"
            >
              {creatingJob ? "Creating..." : "Create Job"}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Start a new job when you want a new batch with its own completion rate.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Labeler</div>
          <select
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select labeler</option>
            {labelers.map((item) => (
              <option key={item._id} value={item._id}>
                {item.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Images</div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            className="border rounded px-3 py-2"
          />
          <div className="text-xs text-gray-500">{files.length} file(s) selected</div>
          {files.length > 0 ? (
            <div className="text-xs text-gray-500">
              Total size: {formatBytes(totalSelectedBytes)}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded border bg-gray-50 p-4">
            <div className="text-sm font-medium">Upload Progress</div>
            <div className="mt-3">
              <ProgressBar progress={uploadProgress} hideLabel />
            </div>
            <div className="mt-3 text-xs text-gray-500">
              {`Uploaded ${formatBytes(uploadLoadedBytes)} of ${formatBytes(totalBytes)}`}
            </div>
            <div className="text-xs text-gray-500">
              {`Left to finish: ${formatBytes(remainingBytes)}`}
            </div>
            <div className="text-xs text-gray-500">
              {`Selected files: ${files.length}`}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={uploadFiles}
          disabled={loading || !assignedTo || !jobId || files.length < 1}
          className="!w-auto self-start shrink-0 border px-6 py-2 rounded inline-flex disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
