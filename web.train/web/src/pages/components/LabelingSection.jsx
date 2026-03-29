import { useEffect, useRef, useState } from "react";
import { mainApi } from "../../providers/api";
import { getAbsolutePath } from "../../providers/format";
import { confirmPopup, errorAlert, successAlert } from "../../providers/alert";
import QueuePagination from "./QueuePagination";

const DEFAULT_PAGE_SIZE = 24;
const ALL_JOBS_VALUE = "__all_jobs__";
const JOBS_REFRESH_MS = 30000;
const QUEUE_REFRESH_MS = 5000;
const STATUS_OPTIONS = [
  {
    value: "uploaded",
    label: "Waiting for Labeling",
    description: "Images you still need to label.",
    totalLabel: "Pending images",
    emptyLabel: "No images waiting for labels.",
  },
  {
    value: "labeled",
    label: "Submitted to Examiner",
    description: "Images you already labeled and sent for review.",
    totalLabel: "Submitted images",
    emptyLabel: "No submitted labels found.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Images approved by the examiner.",
    totalLabel: "Approved images",
    emptyLabel: "No approved labels found.",
  },
];

const getSortForStatus = (status) => {
  if (status === "labeled") {
    return {
      labeledAt: -1,
      _id: -1,
    };
  }

  if (status === "approved") {
    return {
      approvedAt: -1,
      _id: -1,
    };
  }

  return {
    created: -1,
    _id: -1,
  };
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString();
};

const LabelingSection = ({ refreshKey }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(ALL_JOBS_VALUE);
  const [statusFilter, setStatusFilter] = useState("uploaded");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftLabels, setDraftLabels] = useState({});
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const inputRefs = useRef({});
  const pendingFocusId = useRef("");
  const hasAutofocused = useRef(false);

  const statusMeta =
    STATUS_OPTIONS.find((option) => option.value === statusFilter) ||
    STATUS_OPTIONS[0];

  const focusInput = (itemId) => {
    const input = inputRefs.current[itemId];

    if (!input) return;

    input.focus();
    input.select();
  };

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
      setSelectedJobId((previous) => {
        if (previous && nextJobs.some((item) => item._id === previous)) {
          return previous;
        }

        return ALL_JOBS_VALUE;
      });
    } catch (err) {
      setJobs([]);
      setSelectedJobId(ALL_JOBS_VALUE);
      setError(err);
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
            status: statusFilter,
            ...(selectedJobId && selectedJobId !== ALL_JOBS_VALUE
              ? { job: selectedJobId }
              : {}),
          },
          offset: nextPage,
          limit: nextPageSize,
          sort: getSortForStatus(statusFilter),
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
    fetchJobs();

    const intervalId = window.setInterval(() => {
      fetchJobs();
    }, JOBS_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  useEffect(() => {
    hasAutofocused.current = false;
    fetchItems({ silent: true });

    const intervalId = window.setInterval(() => {
      fetchItems({ silent: true, background: true });
    }, QUEUE_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, refreshKey, selectedJobId, statusFilter]);

  useEffect(() => {
    if (!["uploaded", "labeled"].includes(statusFilter)) {
      hasAutofocused.current = false;
      pendingFocusId.current = "";
      return;
    }

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
  }, [items, statusFilter]);

  const saveLabel = async (itemId) => {
    const label = draftLabels[itemId]?.trim();

    if (!label) return;

    setSavingId(itemId);

    try {
      const currentIndex = items.findIndex((item) => item._id === itemId);
      pendingFocusId.current =
        statusFilter === "uploaded"
          ? items[currentIndex + 1]?._id || items[currentIndex - 1]?._id || ""
          : itemId;

      await mainApi({
        url: `/file/label/${itemId}`,
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
    }
  };

  const trashItem = async (itemId) => {
    const confirmed = await confirmPopup(
      "Move this image to trash? Admin can review deleted images later."
    );

    if (!confirmed?.isConfirmed) {
      return;
    }

    setDeletingId(itemId);

    try {
      const currentIndex = items.findIndex((item) => item._id === itemId);
      pendingFocusId.current =
        items[currentIndex + 1]?._id || items[currentIndex - 1]?._id || "";

      await mainApi({
        url: `/file/trash/${itemId}`,
        method: "PUT",
      });

      await fetchItems({ silent: true, background: true });
      setError("");
      await successAlert("action.success", "Image moved to trash.");
    } catch (err) {
      pendingFocusId.current = itemId;
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Labeling Queue</div>
      <div className="text-sm text-gray-500 mt-1">
        Choose one of your assigned jobs, then switch between pending work and
        the images you already submitted or completed.
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Assigned Job</div>
          <select
            value={selectedJobId}
            onChange={(event) => {
              setPage(0);
              setSelectedJobId(event.target.value);
            }}
            className="border rounded px-3 py-2"
          >
            <option value={ALL_JOBS_VALUE}>All Assigned Jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.name}
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500">
            Only jobs that have images assigned to you are listed here.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">View</div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(0);
              setStatusFilter(event.target.value);
            }}
            className="border rounded px-3 py-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500">{statusMeta.description}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-500">
        {`${statusMeta.totalLabel}: ${total}`}
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : (
        <>
          {error ? <div className="mt-4 text-sm text-red-500">{error}</div> : null}
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
            <div className="mt-4 text-sm text-gray-500">{statusMeta.emptyLabel}</div>
          ) : total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
              {items.map((item) => {
                const isEditable = ["uploaded", "labeled"].includes(item?.status);
                const isDeclined = Boolean(
                  item?.declinedAt ||
                    (item?.status === "uploaded" && item?.label && item?.labeledAt)
                );
                const isWaitingForReview = item?.status === "labeled";

                return (
                  <div
                    key={item._id}
                    className="border rounded p-4 flex flex-col gap-3"
                  >
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
                      Job: {item?.job?.name || "No Job"}
                    </div>

                    {item?.labeledAt ? (
                      <div className="text-xs text-gray-500">
                        Submitted: {formatDateTime(item.labeledAt)}
                      </div>
                    ) : null}

                    {item?.approvedAt ? (
                      <div className="text-xs text-gray-500">
                        Approved: {formatDateTime(item.approvedAt)}
                      </div>
                    ) : null}

                    {isDeclined ? (
                      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {`Declined by ${item?.declinedBy?.username || "examiner"}. Review and resubmit.`}
                        {formatDateTime(item.declinedAt || item.labeledAt)
                          ? ` (${formatDateTime(item.declinedAt || item.labeledAt)})`
                          : ""}
                      </div>
                    ) : null}

                    {isWaitingForReview ? (
                      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        Waiting for examiner review. You can still update the
                        submitted text until it is approved.
                      </div>
                    ) : null}

                    <input
                      type="text"
                      ref={(element) => {
                        if (element && isEditable) {
                          inputRefs.current[item._id] = element;
                          return;
                        }

                        delete inputRefs.current[item._id];
                      }}
                      value={draftLabels[item._id] || ""}
                      readOnly={!isEditable}
                      onChange={(event) =>
                        setDraftLabels((previous) => ({
                          ...previous,
                          [item._id]: event.target.value.toUpperCase(),
                        }))
                      }
                      onKeyDown={(event) => {
                        if (
                          !isEditable ||
                          event.key !== "Enter" ||
                          event.nativeEvent.isComposing
                        ) {
                          return;
                        }

                        event.preventDefault();
                        saveLabel(item._id);
                      }}
                      placeholder="Type plate text, e.g. 0659 УНГ"
                      className={`border rounded px-3 py-2 uppercase ${
                        isEditable ? "" : "bg-gray-50 text-gray-600"
                      }`}
                    />

                    {isEditable ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveLabel(item._id)}
                          disabled={
                            !draftLabels[item._id]?.trim() ||
                            savingId === item._id ||
                            deletingId === item._id
                          }
                          className={`!w-auto border px-4 py-2 rounded inline-flex disabled:opacity-50 ${
                            isDeclined ? "!bg-red-600 !border-red-600 text-white" : ""
                          }`}
                        >
                          {savingId === item._id
                            ? "Submitting..."
                            : isDeclined
                              ? "Resubmit Label"
                              : isWaitingForReview
                                ? "Update Submitted Label"
                                : "Submit Label"}
                        </button>
                        <button
                          type="button"
                          onClick={() => trashItem(item._id)}
                          disabled={savingId === item._id || deletingId === item._id}
                          className="!w-auto border px-4 py-2 rounded inline-flex bg-red-600 text-white disabled:opacity-50"
                        >
                          {deletingId === item._id ? "Moving..." : "Move to Trash"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {item?.status === "labeled"
                          ? "Waiting for examiner review."
                          : "Approved by examiner."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default LabelingSection;
