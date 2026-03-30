import { useEffect, useMemo, useRef, useState } from "react";
import { mainApi } from "../../providers/api";
import { getAbsolutePath } from "../../providers/format";
import { confirmPopup, errorAlert, successAlert } from "../../providers/alert";
import QueuePagination from "./QueuePagination";
import DetectionCanvas from "./DetectionCanvas";

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

const getTaskType = (item) => item?.taskType || item?.job?.taskType || "ocr";
const isDetectionOnlyTask = (item) => getTaskType(item) === "detection";
const isDetectionCapableTask = (item) =>
  ["ocr_detection", "detection"].includes(getTaskType(item));
const getInitialText = (item) => item?.ocrText || item?.label || "";
const getInitialAnnotations = (item) =>
  Array.isArray(item?.annotations) ? item.annotations : [];
const getInitialImageMeta = (item) =>
  item?.imageMeta || {
    width: 0,
    height: 0,
  };
const getClassOptions = (item) =>
  Array.isArray(item?.job?.classes) && item.job.classes.length > 0
    ? item.job.classes
    : ["plate"];

const getTaskLabel = (itemOrTaskType) => {
  const taskType =
    typeof itemOrTaskType === "string" ? itemOrTaskType : getTaskType(itemOrTaskType);

  if (taskType === "ocr_detection") return "OCR + Detection";
  if (taskType === "detection") return "Detection";
  return "OCR";
};

const canSubmitItem = (item, draftLabels, draftAnnotations) => {
  const text = (draftLabels[item._id] || "").trim();
  const boxes = (draftAnnotations[item._id] || []).length;

  if (isDetectionOnlyTask(item)) {
    return boxes > 0;
  }

  if (isDetectionCapableTask(item)) {
    return Boolean(text && boxes > 0);
  }

  return Boolean(text);
};

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
  const [currentItemId, setCurrentItemId] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftLabels, setDraftLabels] = useState({});
  const [draftAnnotations, setDraftAnnotations] = useState({});
  const [draftImageMeta, setDraftImageMeta] = useState({});
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const inputRef = useRef(null);

  const statusMeta =
    STATUS_OPTIONS.find((option) => option.value === statusFilter) ||
    STATUS_OPTIONS[0];

  const currentItem =
    items.find((item) => item._id === currentItemId) || items[0] || null;
  const currentIndex = currentItem
    ? items.findIndex((item) => item._id === currentItem._id)
    : -1;

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
      setCurrentItemId((previous) =>
        previous && nextItems.some((item) => item._id === previous)
          ? previous
          : nextItems[0]?._id || ""
      );
      setTotal(nextTotal);
      setDraftLabels((previous) =>
        nextItems.reduce((accumulator, item) => {
          accumulator[item._id] = previous[item._id] ?? getInitialText(item);
          return accumulator;
        }, {})
      );
      setDraftAnnotations((previous) =>
        nextItems.reduce((accumulator, item) => {
          accumulator[item._id] = previous[item._id] ?? getInitialAnnotations(item);
          return accumulator;
        }, {})
      );
      setDraftImageMeta((previous) =>
        nextItems.reduce((accumulator, item) => {
          accumulator[item._id] = previous[item._id] ?? getInitialImageMeta(item);
          return accumulator;
        }, {})
      );
    } catch (err) {
      if (!background) {
        setItems([]);
        setCurrentItemId("");
        setDraftLabels({});
        setDraftAnnotations({});
        setDraftImageMeta({});
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
    if (!currentItem || isDetectionOnlyTask(currentItem)) {
      return;
    }

    inputRef.current?.focus();
  }, [currentItemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToItem = (direction) => {
    if (!items.length || currentIndex < 0) return;

    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < items.length) {
      setCurrentItemId(items[nextIndex]._id);
    }
  };

  const saveLabel = async (itemId) => {
    const item = items.find((entry) => entry._id === itemId);

    if (!item || !canSubmitItem(item, draftLabels, draftAnnotations)) return;

    setSavingId(itemId);

    try {
      const itemIndex = items.findIndex((entry) => entry._id === itemId);
      const nextFocusId =
        statusFilter === "uploaded"
          ? items[itemIndex + 1]?._id || items[itemIndex - 1]?._id || ""
          : itemId;

      await mainApi({
        url: `/file/label/${itemId}`,
        method: "PUT",
        data: {
          ocrText: draftLabels[itemId] || "",
          annotations: draftAnnotations[itemId] || [],
          imageMeta: draftImageMeta[itemId] || { width: 0, height: 0 },
        },
      });

      await fetchItems({ silent: true, background: true });
      setCurrentItemId(nextFocusId);
      setError("");
    } catch (err) {
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
      const itemIndex = items.findIndex((item) => item._id === itemId);
      const nextFocusId =
        items[itemIndex + 1]?._id || items[itemIndex - 1]?._id || "";

      await mainApi({
        url: `/file/trash/${itemId}`,
        method: "PUT",
      });

      await fetchItems({ silent: true, background: true });
      setCurrentItemId(nextFocusId);
      setError("");
      await successAlert("action.success", "Image moved to trash.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      const isInputTarget = ["INPUT", "TEXTAREA"].includes(
        event.target?.tagName || ""
      );

      if (!currentItem) return;

      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        if (!isInputTarget) {
          event.preventDefault();
          goToItem(-1);
        }
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        if (!isInputTarget) {
          event.preventDefault();
          goToItem(1);
        }
      }

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        (isInputTarget || isDetectionOnlyTask(currentItem))
      ) {
        event.preventDefault();
        saveLabel(currentItem._id);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }); // intentional dynamic currentItem usage

  const sidebarItems = useMemo(() => items, [items]);

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Labeling Workspace</div>
      <div className="mt-1 text-sm text-gray-500">
        Single-image annotation workspace for OCR, OCR+detection, and detection jobs.
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
            className="rounded border px-3 py-2"
          >
            <option value={ALL_JOBS_VALUE}>All Assigned Jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.name} ({getTaskLabel(job?.taskType)})
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
            className="rounded border px-3 py-2"
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

      <div className="mt-3 text-sm text-gray-500">{`${statusMeta.totalLabel}: ${total}`}</div>

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
          ) : currentItem ? (
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="rounded border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-medium">{currentItem.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Assigned to: {currentItem?.assignedTo?.username || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Job: {currentItem?.job?.name || "No Job"} • {getTaskLabel(currentItem)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentItem?.approvedAt
                      ? `Approved ${formatDateTime(currentItem.approvedAt)}`
                      : currentItem?.labeledAt
                        ? `Submitted ${formatDateTime(currentItem.labeledAt)}`
                        : `Created ${formatDateTime(currentItem.created)}`}
                  </div>
                </div>

                <div className="mt-4">
                  {isDetectionCapableTask(currentItem) ? (
                    <DetectionCanvas
                      src={getAbsolutePath(currentItem)}
                      annotations={draftAnnotations[currentItem._id] || []}
                      onChange={(nextAnnotations) =>
                        setDraftAnnotations((previous) => ({
                          ...previous,
                          [currentItem._id]: nextAnnotations,
                        }))
                      }
                      imageMeta={draftImageMeta[currentItem._id]}
                      onImageMetaChange={(nextImageMeta) =>
                        setDraftImageMeta((previous) => ({
                          ...previous,
                          [currentItem._id]: nextImageMeta,
                        }))
                      }
                      classOptions={getClassOptions(currentItem)}
                      readOnly={!["uploaded", "labeled"].includes(currentItem?.status)}
                      onRequestSave={() => saveLabel(currentItem._id)}
                    />
                  ) : (
                    <img
                      src={getAbsolutePath(currentItem)}
                      alt={currentItem.name}
                      className="h-[32rem] w-full rounded bg-gray-100 object-contain"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>

                {!isDetectionOnlyTask(currentItem) ? (
                  <div className="mt-4">
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                      OCR Text
                    </div>
                    <input
                      type="text"
                      ref={inputRef}
                      value={draftLabels[currentItem._id] || ""}
                      readOnly={!["uploaded", "labeled"].includes(currentItem?.status)}
                      onChange={(event) =>
                        setDraftLabels((previous) => ({
                          ...previous,
                          [currentItem._id]: event.target.value.toUpperCase(),
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                          return;
                        }

                        event.preventDefault();
                        saveLabel(currentItem._id);
                      }}
                      placeholder={
                        isDetectionCapableTask(currentItem)
                          ? "Type text for the selected target"
                          : "Type plate text, e.g. 0659 УНГ"
                      }
                      className="mt-2 w-full rounded border px-3 py-2 uppercase"
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => goToItem(-1)}
                    disabled={currentIndex <= 0}
                    className="!w-auto rounded border px-4 py-2 inline-flex disabled:opacity-50"
                  >
                    Previous `A`
                  </button>
                  <button
                    type="button"
                    onClick={() => goToItem(1)}
                    disabled={currentIndex < 0 || currentIndex >= items.length - 1}
                    className="!w-auto rounded border px-4 py-2 inline-flex disabled:opacity-50"
                  >
                    Next `D`
                  </button>
                  <button
                    type="button"
                    onClick={() => saveLabel(currentItem._id)}
                    disabled={
                      !canSubmitItem(currentItem, draftLabels, draftAnnotations) ||
                      savingId === currentItem._id ||
                      deletingId === currentItem._id
                    }
                    className="!w-auto rounded border px-4 py-2 inline-flex disabled:opacity-50"
                  >
                    {savingId === currentItem._id ? "Submitting..." : "Submit Annotation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => trashItem(currentItem._id)}
                    disabled={
                      savingId === currentItem._id || deletingId === currentItem._id
                    }
                    className="!w-auto rounded border bg-red-600 px-4 py-2 inline-flex text-white disabled:opacity-50"
                  >
                    {deletingId === currentItem._id ? "Moving..." : "Move to Trash"}
                  </button>
                </div>
              </div>

              <div className="rounded border p-4">
                <div className="text-sm font-medium">Page Queue</div>
                <div className="mt-1 text-xs text-gray-500">
                  Select an image directly or use `A` / `D` to move through this page.
                </div>
                <div className="mt-4 flex max-h-[44rem] flex-col gap-3 overflow-y-auto pr-1">
                  {sidebarItems.map((item, index) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setCurrentItemId(item._id)}
                      className={`w-full rounded border p-2 text-left ${
                        item._id === currentItem?._id
                          ? "border-black bg-gray-50"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={getAbsolutePath(item)}
                        alt={item.name}
                        className="h-24 w-full rounded bg-gray-100 object-contain"
                        crossOrigin="anonymous"
                      />
                      <div className="mt-2 text-xs font-medium text-black">
                        {index + 1}. {item.name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {getTaskLabel(item)} • {item.status}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default LabelingSection;
