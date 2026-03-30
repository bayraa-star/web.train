import { useEffect, useMemo, useRef, useState } from "react";
import { mainApi } from "../../providers/api";
import { getAbsolutePath } from "../../providers/format";
import { errorAlert } from "../../providers/alert";
import QueuePagination from "./QueuePagination";
import DetectionCanvas from "./DetectionCanvas";

const DEFAULT_PAGE_SIZE = 24;
const ALL_JOBS_VALUE = "__all_jobs__";
const QUEUE_REFRESH_MS = 5000;

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

const ExaminerSection = ({ refreshKey }) => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(ALL_JOBS_VALUE);
  const [items, setItems] = useState([]);
  const [currentItemId, setCurrentItemId] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftLabels, setDraftLabels] = useState({});
  const [draftAnnotations, setDraftAnnotations] = useState({});
  const [draftImageMeta, setDraftImageMeta] = useState({});
  const [savingId, setSavingId] = useState("");
  const [savingAction, setSavingAction] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const inputRef = useRef(null);

  const currentItem =
    items.find((item) => item._id === currentItemId) || items[0] || null;
  const currentIndex = currentItem
    ? items.findIndex((item) => item._id === currentItem._id)
    : -1;

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
            ...(selectedJobId && selectedJobId !== ALL_JOBS_VALUE
              ? { job: selectedJobId }
              : {}),
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

          return ALL_JOBS_VALUE;
        });
      } catch (err) {
        setJobs([]);
        setSelectedJobId(ALL_JOBS_VALUE);
        setError(err);
      }
    };

    fetchJobs();
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
  }, [page, pageSize, refreshKey, selectedJobId]);

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

  const approveLabel = async (itemId) => {
    const item = items.find((entry) => entry._id === itemId);
    const label = (draftLabels[itemId] || "").trim();
    const annotations = draftAnnotations[itemId] || [];

    if (!item) return;
    if (!isDetectionOnlyTask(item) && !label) return;
    if (isDetectionCapableTask(item) && annotations.length < 1) return;

    setSavingId(itemId);
    setSavingAction("approve");

    try {
      const itemIndex = items.findIndex((entry) => entry._id === itemId);
      const nextFocusId =
        items[itemIndex + 1]?._id || items[itemIndex - 1]?._id || "";

      await mainApi({
        url: `/file/approve/${itemId}`,
        method: "PUT",
        data: {
          ocrText: draftLabels[itemId] || "",
          annotations,
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
      setSavingAction("");
    }
  };

  const declineLabel = async (itemId) => {
    setSavingId(itemId);
    setSavingAction("decline");

    try {
      const itemIndex = items.findIndex((item) => item._id === itemId);
      const nextFocusId =
        items[itemIndex + 1]?._id || items[itemIndex - 1]?._id || "";

      await mainApi({
        url: `/file/decline/${itemId}`,
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
      setSavingAction("");
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
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }); // intentional dynamic currentItem usage

  const sidebarItems = useMemo(() => items, [items]);

  return (
    <div className="mt-8 rounded border bg-white p-6 shadow">
      <div className="text-lg font-semibold">Examiner Workspace</div>
      <div className="mt-1 text-sm text-gray-500">
        Single-image review workspace for OCR, OCR+detection, and detection submissions.
      </div>
      <div className="mt-4 flex flex-col gap-2 md:max-w-md">
        <div className="text-sm font-medium">Job</div>
        <select
          value={selectedJobId}
          onChange={(event) => {
            setPage(0);
            setSelectedJobId(event.target.value);
          }}
          className="rounded border px-3 py-2"
        >
          <option value={ALL_JOBS_VALUE}>All Jobs</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.name} ({getTaskLabel(job?.taskType)})
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
          ) : currentItem ? (
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="rounded border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                  <div>
                    <div className="text-sm font-medium">{currentItem.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Assigned to: {currentItem?.assignedTo?.username || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted by: {currentItem?.labeledBy?.username || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Job: {currentItem?.job?.name || "No Job"} • {getTaskLabel(currentItem)}
                    </div>
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
                      classOptions={getClassOptions(currentItem)}
                      onImageMetaChange={(nextImageMeta) =>
                        setDraftImageMeta((previous) => ({
                          ...previous,
                          [currentItem._id]: nextImageMeta,
                        }))
                      }
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
                      onChange={(event) =>
                        setDraftLabels((prev) => ({
                          ...prev,
                          [currentItem._id]: event.target.value.toUpperCase(),
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" || event.nativeEvent.isComposing) {
                          return;
                        }

                        event.preventDefault();
                        approveLabel(currentItem._id);
                      }}
                      placeholder="Review final OCR text"
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
                    onClick={() => approveLabel(currentItem._id)}
                    disabled={
                      savingId === currentItem._id ||
                      (!isDetectionOnlyTask(currentItem) &&
                        !draftLabels[currentItem._id]?.trim()) ||
                      (isDetectionCapableTask(currentItem) &&
                        (draftAnnotations[currentItem._id] || []).length < 1)
                    }
                    className="!w-auto rounded border px-4 py-2 inline-flex disabled:opacity-50"
                  >
                    {savingId === currentItem._id && savingAction === "approve"
                      ? "Approving..."
                      : "Approve"}
                  </button>
                  <button
                    type="button"
                    onClick={() => declineLabel(currentItem._id)}
                    disabled={savingId === currentItem._id}
                    className="!w-auto rounded border bg-red-600 px-4 py-2 inline-flex text-white disabled:opacity-50"
                  >
                    {savingId === currentItem._id && savingAction === "decline"
                      ? "Declining..."
                      : "Decline"}
                  </button>
                </div>
              </div>

              <div className="rounded border p-4">
                <div className="text-sm font-medium">Page Queue</div>
                <div className="mt-1 text-xs text-gray-500">
                  Select an item directly or use `A` / `D` to move through this page.
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

export default ExaminerSection;
