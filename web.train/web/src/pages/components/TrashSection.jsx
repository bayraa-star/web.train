import { useEffect, useState } from "react";
import { mainApi } from "../../providers/api";
import { getAbsolutePath } from "../../providers/format";
import { errorAlert } from "../../providers/alert";
import QueuePagination from "./QueuePagination";

const DEFAULT_PAGE_SIZE = 24;

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const TrashSection = ({ refreshKey }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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

        return "";
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

  const fetchItems = async ({
    silent = false,
    background = false,
    pageOverride,
    pageSizeOverride,
  } = {}) => {
    const nextPage = pageOverride ?? page;
    const nextPageSize = pageSizeOverride ?? pageSize;

    if (!background) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await mainApi({
        url: "/file/table",
        method: "POST",
        data: {
          find: {
            status: "deleted",
            ...(selectedJobId ? { job: selectedJobId } : {}),
          },
          offset: nextPage,
          limit: nextPageSize,
          sort: {
            deletedAt: -1,
            _id: -1,
          },
        },
      });

      const nextTotal = Number(response?.data?.total || 0);
      const nextItems = response?.data?.items || [];
      const resolvedPageSize = Number(response?.data?.limit || nextPageSize);
      const lastPage = Math.max(Math.ceil(nextTotal / resolvedPageSize) - 1, 0);

      if (nextItems.length < 1 && nextTotal > 0 && nextPage > lastPage) {
        setPage(lastPage);
        return;
      }

      setItems(nextItems);
      setTotal(nextTotal);
    } catch (err) {
      if (!background) {
        setItems([]);
        setTotal(0);
      }
      setError(err);

      if (!silent) {
        await errorAlert("action.error", err);
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchJobs({ silent: true });
  }, [refreshKey]);

  useEffect(() => {
    fetchItems({ silent: true });

    const intervalId = window.setInterval(() => {
      fetchItems({ silent: true, background: true });
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshKey, selectedJobId]);

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Trash</div>
      <div className="mt-1 text-sm text-gray-500">
        Review images that labelers moved to trash. These files remain stored
        with status `deleted`.
      </div>

      <div className="mt-4 flex flex-col gap-2 md:max-w-md">
        <div className="text-sm font-medium">Job</div>
        <select
          value={selectedJobId}
          onChange={(event) => {
            setPage(0);
            setSelectedJobId(event.target.value);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">All Jobs</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 text-sm text-gray-500">{`Deleted images: ${total}`}</div>
      {error ? <div className="mt-3 text-sm text-red-500">{error}</div> : null}

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : total < 1 && !error ? (
        <div className="mt-4 text-sm text-gray-500">No deleted images found.</div>
      ) : (
        <>
          {total > 0 && (
            <QueuePagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPage(0);
                setPageSize(value);
              }}
            />
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="px-3 py-3 font-medium">Preview</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Original Name</th>
                  <th className="px-3 py-3 font-medium">Job</th>
                  <th className="px-3 py-3 font-medium">Assigned To</th>
                  <th className="px-3 py-3 font-medium">Deleted By</th>
                  <th className="px-3 py-3 font-medium">Deleted At</th>
                  <th className="px-3 py-3 font-medium">Label</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-b align-top">
                    <td className="px-3 py-3">
                      <img
                        src={getAbsolutePath(item)}
                        alt={item.name}
                        className="h-16 w-24 rounded bg-gray-100 object-contain"
                        crossOrigin="anonymous"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">{item.name || "-"}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {item.originalName || "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {item?.job?.name || "No Job"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {item?.assignedTo?.username || "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {item?.deletedBy?.username || "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.deletedAt)}
                    </td>
                    <td className="px-3 py-3 text-gray-500 uppercase">
                      {item.label || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TrashSection;
