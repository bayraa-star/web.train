import { useEffect, useState } from "react";
import { mainApi } from "../../providers/api";
import {
  confirmPopup,
  errorAlert,
  successAlert,
} from "../../providers/alert";

const EMPTY_JOB_FORM = {
  name: "",
  description: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString();
};

const JobManagementSection = ({ refreshKey, onChanged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_JOB_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const fetchJobs = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

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

      setItems(response?.data?.items || []);
    } catch (err) {
      setItems([]);
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

  useEffect(() => {
    fetchJobs({ silent: true });
  }, [refreshKey]);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name || "",
      description: item.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(EMPTY_JOB_FORM);
  };

  const updateField = (key, value) => {
    setEditForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveJob = async (id) => {
    setSaving(true);
    setError("");

    try {
      await mainApi({
        url: `/job/${id}`,
        method: "PUT",
        data: {
          name: editForm.name,
          description: editForm.description,
        },
      });

      cancelEdit();
      await fetchJobs({ silent: true });
      onChanged && onChanged();
      await successAlert("action.success", "Job updated successfully.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setSaving(false);
    }
  };

  const removeJob = async (item) => {
    const confirmed = await confirmPopup(
      `Delete job ${item.name}? This cannot be undone.`
    );

    if (!confirmed?.isConfirmed) {
      return;
    }

    setDeletingId(item._id);
    setError("");

    try {
      await mainApi({
        url: `/job/${item._id}`,
        method: "DELETE",
      });

      if (editingId === item._id) {
        cancelEdit();
      }

      await fetchJobs({ silent: true });
      onChanged && onChanged();
      await successAlert("action.success", "Job deleted successfully.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Manage Jobs</div>
      <div className="text-sm text-gray-500 mt-1">
        Review and rename existing upload jobs.
      </div>
      {error ? <div className="mt-2 text-sm text-red-500">{error}</div> : null}

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : items.length < 1 ? (
        <div className="mt-4 text-sm text-gray-500">No jobs found.</div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="px-3 py-3 font-medium">Job</th>
                <th className="px-3 py-3 font-medium">Description</th>
                <th className="px-3 py-3 font-medium">Created</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingId === item._id;
                const isDeleting = deletingId === item._id;

                return (
                  <tr key={item._id} className="border-b align-top">
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(event) => updateField("name", event.target.value)}
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        <div className="font-medium">{item.name}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(event) => updateField("description", event.target.value)}
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        item.description || "-"
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {formatDateTime(item.created)}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveJob(item._id)}
                            disabled={saving || isDeleting}
                            className="!w-auto border px-4 py-2 rounded inline-flex disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving || isDeleting}
                            className="!w-auto border px-4 py-2 rounded inline-flex bg-gray-600 text-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            disabled={!!deletingId}
                            className="!w-auto border px-4 py-2 rounded inline-flex disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeJob(item)}
                            disabled={!!editingId || isDeleting}
                            className="!w-auto border px-4 py-2 rounded inline-flex bg-red-600 text-white disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
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

export default JobManagementSection;
