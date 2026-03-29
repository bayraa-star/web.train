import { useEffect, useState } from "react";
import { mainApi } from "../../providers/api";
import { errorAlert } from "../../providers/alert";

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const SummaryCard = ({ label, value, tone = "text-black" }) => (
  <div className="rounded border bg-white p-4">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
  </div>
);

const AdminProgressSection = ({ refreshKey }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    labelers: 0,
    total: 0,
    uploaded: 0,
    labeled: 0,
    approved: 0,
    reviewRate: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetProgress = () => {
    setItems([]);
    setSummary({
      labelers: 0,
      total: 0,
      uploaded: 0,
      labeled: 0,
      approved: 0,
      reviewRate: 0,
      completionRate: 0,
    });
  };

  useEffect(() => {
    const fetchJobs = async ({ silent = false } = {}) => {
      setError("");

      try {
        const response = await mainApi({
          url: "/job/table",
          method: "POST",
          data: {
            limit: 100,
            sort: {
              created: -1,
            },
          },
        });

        const nextJobs = response?.data?.items || [];

        setJobs(nextJobs);
        setSelectedJobId((previous) => {
          if (previous && nextJobs.some((item) => item._id === previous)) {
            return previous;
          }

          return nextJobs?.[0]?._id || "";
        });
      } catch (err) {
        setJobs([]);
        setSelectedJobId("");
        setError(err);

        if (!silent) {
          await errorAlert("action.error", err);
        }
      }
    };

    fetchJobs({ silent: true });

    return undefined;
  }, [refreshKey]);

  useEffect(() => {
    const fetchProgress = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError("");

      try {
        const response = await mainApi({
          url: "/file/progress",
          method: "GET",
          params: selectedJobId ? { jobId: selectedJobId } : {},
        });

        setItems(response?.data?.items || []);
        setSummary(
          response?.data?.summary || {
            labelers: 0,
            total: 0,
            uploaded: 0,
            labeled: 0,
            approved: 0,
            reviewRate: 0,
            completionRate: 0,
          }
        );
      } catch (err) {
        resetProgress();
        setError(err);

        if (!silent) {
          await errorAlert("action.error", err);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

    fetchProgress({ silent: true });

    const intervalId = window.setInterval(() => {
      fetchProgress({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshKey, selectedJobId]);

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Labeling Progress</div>
      <div className="mt-1 text-sm text-gray-500">
        Track how many images each labeler still needs to label, has submitted,
        and has already passed examiner review.
      </div>
      <div className="mt-4 flex flex-col gap-2 md:max-w-md">
        <div className="text-sm font-medium">Job</div>
        <select
          value={selectedJobId}
          onChange={(event) => setSelectedJobId(event.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Jobs</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.name}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500">
          Choose a job to keep completion percentages stable for each finished batch.
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-red-500">{error}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Labelers" value={summary.labelers} />
        <SummaryCard label="Total Images" value={summary.total} />
        <SummaryCard label="Waiting Labeling" value={summary.uploaded} tone="text-amber-700" />
        <SummaryCard label="Waiting Review" value={summary.labeled} tone="text-blue-700" />
        <SummaryCard label="Approved" value={summary.approved} tone="text-green-700" />
        <SummaryCard
          label="Completed"
          value={`${summary.completionRate}%`}
          tone="text-green-700"
        />
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : items.length < 1 ? (
        <div className="mt-4 text-sm text-gray-500">No labeler progress yet.</div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="px-3 py-3 font-medium">Labeler</th>
                <th className="px-3 py-3 font-medium text-right">Total</th>
                <th className="px-3 py-3 font-medium text-right">Waiting Labeling</th>
                <th className="px-3 py-3 font-medium text-right">Waiting Review</th>
                <th className="px-3 py-3 font-medium text-right">Approved</th>
                <th className="px-3 py-3 font-medium text-right">Review %</th>
                <th className="px-3 py-3 font-medium text-right">Complete %</th>
                <th className="px-3 py-3 font-medium">First Labeled</th>
                <th className="px-3 py-3 font-medium">Last Labeled</th>
                <th className="px-3 py-3 font-medium">First Approved</th>
                <th className="px-3 py-3 font-medium">Last Approved</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const displayName = [item?.labeler?.firstname, item?.labeler?.lastname]
                  .filter(Boolean)
                  .join(" ")
                  .trim();

                return (
                  <tr key={item?.labeler?._id || item?.labeler?.username} className="border-b">
                    <td className="px-3 py-3">
                      <div className="font-medium text-black">
                        {displayName || item?.labeler?.username || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item?.labeler?.username || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{item.total}</td>
                    <td className="px-3 py-3 text-right text-amber-700">{item.uploaded}</td>
                    <td className="px-3 py-3 text-right text-blue-700">{item.labeled}</td>
                    <td className="px-3 py-3 text-right text-green-700">{item.approved}</td>
                    <td className="px-3 py-3 text-right">{item.reviewRate}%</td>
                    <td className="px-3 py-3 text-right">{item.completionRate}%</td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.firstLabeledAt)}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.lastLabeledAt)}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.firstApprovedAt)}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.lastApprovedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProgressSection;
