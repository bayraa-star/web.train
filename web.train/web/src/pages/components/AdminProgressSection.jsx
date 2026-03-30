import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const formatGiB = (bytes) => {
  if (!bytes && bytes !== 0) return "-";

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GiB`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toFixed(1)}%`;
};

const UsageCard = ({ title, value, detail, toneClass, barClass }) => (
  <div className="rounded border bg-slate-950 p-5 text-white shadow">
    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
      {title}
    </div>
    <div className={`mt-3 text-4xl font-semibold ${toneClass}`}>{formatPercent(value)}</div>
    <div className="mt-2 text-sm text-slate-300">{detail}</div>
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all ${barClass}`}
        style={{ width: `${Math.max(0, Math.min(Number(value) || 0, 100))}%` }}
      />
    </div>
  </div>
);

const HistoryTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded border bg-white px-3 py-2 text-sm shadow">
      <div className="font-medium text-black">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="text-gray-600">
          {entry.name}: {formatPercent(entry.value)}
        </div>
      ))}
    </div>
  );
};

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
  const [systemMetrics, setSystemMetrics] = useState({
    loading: false,
    error: "",
    capturedAt: "",
    cpu: {
      usage: 0,
      cores: 0,
      loadAverage: [],
    },
    memory: {
      usage: 0,
      usedBytes: 0,
      totalBytes: 0,
    },
    gpu: {
      available: false,
      primary: null,
    },
  });
  const [metricHistory, setMetricHistory] = useState([]);

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

  useEffect(() => {
    const fetchSystemMetrics = async ({ silent = false } = {}) => {
      setSystemMetrics((previous) => ({
        ...previous,
        loading: !silent,
        error: "",
      }));

      try {
        const response = await mainApi({
          url: "/system-monitor/metrics",
          method: "GET",
        });

        const nextMetrics = {
          loading: false,
          error: "",
          capturedAt: response?.data?.capturedAt || "",
          cpu: response?.data?.cpu || {
            usage: 0,
            cores: 0,
            loadAverage: [],
          },
          memory: response?.data?.memory || {
            usage: 0,
            usedBytes: 0,
            totalBytes: 0,
          },
          gpu: response?.data?.gpu || {
            available: false,
            primary: null,
          },
        };

        setSystemMetrics(nextMetrics);
        setMetricHistory((previous) => {
          const nextPoint = {
            time:
              nextMetrics.capturedAt &&
              new Date(nextMetrics.capturedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            cpu: Number(nextMetrics?.cpu?.usage || 0),
            ram: Number(nextMetrics?.memory?.usage || 0),
            gpu: Number(nextMetrics?.gpu?.primary?.usage || 0),
          };

          return [...previous.slice(-19), nextPoint];
        });
      } catch (err) {
        setSystemMetrics((previous) => ({
          ...previous,
          loading: false,
          error: err,
        }));
      }
    };

    fetchSystemMetrics();

    const intervalId = window.setInterval(() => {
      fetchSystemMetrics({ silent: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const gpuPrimary = systemMetrics?.gpu?.primary;

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

      <div className="mt-6 rounded border bg-slate-900 p-6 shadow">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-lg font-semibold text-white">System Usage</div>
            <div className="text-sm text-slate-300">
              CPU, RAM, and GPU utilization sampled from the host every 10 seconds.
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {systemMetrics.capturedAt
              ? `Updated ${formatDateTime(systemMetrics.capturedAt)}`
              : "Waiting for first sample"}
          </div>
        </div>

        {systemMetrics.error ? (
          <div className="mt-4 text-sm text-red-300">{systemMetrics.error}</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <UsageCard
                title="CPU"
                value={systemMetrics?.cpu?.usage}
                detail={`${systemMetrics?.cpu?.cores || 0} cores • load avg ${
                  systemMetrics?.cpu?.loadAverage?.join(" / ") || "-"
                }`}
                toneClass="text-cyan-300"
                barClass="bg-cyan-400"
              />
              <UsageCard
                title="RAM"
                value={systemMetrics?.memory?.usage}
                detail={`${formatGiB(systemMetrics?.memory?.usedBytes)} used of ${formatGiB(
                  systemMetrics?.memory?.totalBytes
                )}`}
                toneClass="text-emerald-300"
                barClass="bg-emerald-400"
              />
              <UsageCard
                title="GPU"
                value={gpuPrimary?.usage}
                detail={
                  systemMetrics?.gpu?.available
                    ? `${gpuPrimary?.name || "GPU"} • ${gpuPrimary?.memoryUsedMiB || 0} / ${
                        gpuPrimary?.memoryTotalMiB || 0
                      } MiB • ${gpuPrimary?.temperatureC ?? "-"} C`
                    : "GPU metrics unavailable"
                }
                toneClass="text-fuchsia-300"
                barClass="bg-fuchsia-400"
              />
            </div>

            <div className="mt-6 h-72 rounded border border-white/10 bg-black/20 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricHistory}>
                  <defs>
                    <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ramFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gpuFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e879f9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#e879f9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<HistoryTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    name="CPU"
                    stroke="#22d3ee"
                    fill="url(#cpuFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="ram"
                    name="RAM"
                    stroke="#34d399"
                    fill="url(#ramFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="gpu"
                    name="GPU"
                    stroke="#e879f9"
                    fill="url(#gpuFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
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
