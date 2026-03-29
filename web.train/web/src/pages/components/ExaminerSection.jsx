import { useEffect, useRef, useState } from "react";
import { mainApi } from "../../providers/api";
import { getAbsolutePath } from "../../providers/format";
import { errorAlert } from "../../providers/alert";
import QueuePagination from "./QueuePagination";

const DEFAULT_PAGE_SIZE = 24;

const ExaminerSection = ({ refreshKey }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftLabels, setDraftLabels] = useState({});
  const [savingId, setSavingId] = useState("");
  const [savingAction, setSavingAction] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const inputRefs = useRef({});
  const pendingFocusId = useRef("");
  const hasAutofocused = useRef(false);

  const focusInput = (itemId) => {
    const input = inputRefs.current[itemId];

    if (!input) return;

    input.focus();
    input.select();
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
            status: "labeled",
            ...(selectedJobId ? { job: selectedJobId } : {}),
          },
          offset: nextPage,
          limit: nextPageSize,
          sort: {
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
      setDraftLabels((previous) =>
        nextItems.reduce((accumulator, item) => {
          accumulator[item._id] = previous[item._id] ?? item.label ?? "";
          return accumulator;
        }, {})
      );
    } catch (err) {
      if (!background) {
        setItems([]);
        setDraftLabels({});
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
    const fetchJobs = async () => {
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
      }
    };

    fetchJobs();
  }, [refreshKey]);

  useEffect(() => {
    hasAutofocused.current = false;
    fetchItems({ silent: true });

    const intervalId = window.setInterval(() => {
      fetchItems({ silent: true, background: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshKey, selectedJobId]);

  useEffect(() => {
    if (items.length < 1) {
      hasAutofocused.current = false;
      pendingFocusId.current = "";
      return;
    }

    if (pendingFocusId.current && inputRefs.current[pendingFocusId.current]) {
      focusInput(pendingFocusId.current);
      pendingFocusId.current = "";
      hasAutofocused.current = true;
      return;
    }

    if (!hasAutofocused.current) {
      focusInput(items[0]?._id);
      hasAutofocused.current = true;
    }
  }, [items]);

  const approveLabel = async (itemId) => {
    const label = draftLabels[itemId]?.trim();

    if (!label) return;

    setSavingId(itemId);
    setSavingAction("approve");

    try {
      const currentIndex = items.findIndex((item) => item._id === itemId);
      pendingFocusId.current =
        items[currentIndex + 1]?._id || items[currentIndex - 1]?._id || "";

      await mainApi({
        url: `/file/approve/${itemId}`,
        method: "PUT",
        data: {
          label,
        },
      });

      await fetchItems({ silent: true, background: true });
      setError("");
    } catch (err) {
      pendingFocusId.current = itemId;
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setSavingId("");
      setSavingAction("");
    }
  };

  const declineLabel = async (itemId) => {
    setSavingId(itemId);
    setSavingAction("decline");

    try {
      const currentIndex = items.findIndex((item) => item._id === itemId);
      pendingFocusId.current =
        items[currentIndex + 1]?._id || items[currentIndex - 1]?._id || "";

      await mainApi({
        url: `/file/decline/${itemId}`,
        method: "PUT",
        data: {
          label: draftLabels[itemId] || "",
        },
      });

      await fetchItems({ silent: true, background: true });
      setError("");
    } catch (err) {
      pendingFocusId.current = itemId;
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setSavingId("");
      setSavingAction("");
    }
  };

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Examiner Queue</div>
      <div className="text-sm text-gray-500 mt-1">
        Review submitted labels, correct them if needed, then press Enter to
        approve and write the final annotation files.
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
        <div className="text-xs text-gray-500">
          Choose the job you want to review before approving or declining labels.
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-500">{`Pending reviews: ${total}`}</div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
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
          {total < 1 && !error ? (
            <div className="mt-4 text-sm text-gray-500">
              No labels waiting for approval.
            </div>
          ) : total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
              {items.map((item) => (
                <div key={item._id} className="border rounded p-4 flex flex-col gap-3">
                  <img
                    src={getAbsolutePath(item)}
                    alt={item.name}
                    className="w-full h-64 object-contain bg-gray-100 rounded"
                    crossOrigin="anonymous"
                  />

                  <div className="text-sm font-medium truncate">{item.name}</div>

                  <div className="text-xs text-gray-500">
                    Assigned to: {item?.assignedTo?.username || "Unknown"}
                  </div>

                  <div className="text-xs text-gray-500">
                    Submitted by: {item?.labeledBy?.username || "Unknown"}
                  </div>

                  <div className="text-xs text-gray-500">
                    Job: {item?.job?.name || "No Job"}
                  </div>

                  <input
                    type="text"
                    ref={(element) => {
                      if (element) {
                        inputRefs.current[item._id] = element;
                        return;
                      }

                      delete inputRefs.current[item._id];
                    }}
                    value={draftLabels[item._id] || ""}
                    onChange={(event) =>
                      setDraftLabels((prev) => ({
                        ...prev,
                        [item._id]: event.target.value.toUpperCase(),
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                        return;
                      }

                      event.preventDefault();
                      approveLabel(item._id);
                    }}
                    placeholder="Review final plate text"
                    className="border rounded px-3 py-2 uppercase"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => approveLabel(item._id)}
                      disabled={!draftLabels[item._id]?.trim() || savingId === item._id}
                      className="!w-auto border px-4 py-2 rounded inline-flex disabled:opacity-50"
                    >
                      {savingId === item._id && savingAction === "approve"
                        ? "Approving..."
                        : "Approve Label"}
                    </button>
                    <button
                      type="button"
                      onClick={() => declineLabel(item._id)}
                      disabled={savingId === item._id}
                      className="!w-auto border px-4 py-2 rounded inline-flex bg-red-600 text-white disabled:opacity-50"
                    >
                      {savingId === item._id && savingAction === "decline"
                        ? "Declining..."
                        : "Decline"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default ExaminerSection;
