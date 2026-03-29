import { useEffect, useMemo, useState } from "react";
import { mainApi } from "../../providers/api";
import {
  confirmPopup,
  errorAlert,
  successAlert,
} from "../../providers/alert";
import { useApp } from "../../providers/app";

const EMPTY_EDIT_FORM = {
  username: "",
  role: "labeler",
  firstname: "",
  lastname: "",
  password: "",
};

const UserManagementSection = ({ refreshKey, onChanged }) => {
  const { user } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const fetchUsers = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await mainApi({
        url: "/user/table",
        method: "POST",
        data: {
          limit: 500,
          sort: {
            username: 1,
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
    fetchUsers({ silent: true });
  }, [refreshKey]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesRole = !roleFilter || item.role === roleFilter;
      const haystack = [
        item.username,
        item.firstname,
        item.lastname,
        item.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || haystack.includes(keyword);

      return matchesRole && matchesSearch;
    });
  }, [items, roleFilter, search]);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      username: item.username || "",
      role: item.role || "labeler",
      firstname: item.firstname || "",
      lastname: item.lastname || "",
      password: "",
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(EMPTY_EDIT_FORM);
  };

  const updateField = (key, value) => {
    setEditForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveUser = async (id) => {
    setSaving(true);
    setError("");

    try {
      const payload = {
        username: editForm.username,
        role: editForm.role,
        firstname: editForm.firstname,
        lastname: editForm.lastname,
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      await mainApi({
        url: `/user/${id}`,
        method: "PUT",
        data: payload,
      });

      cancelEdit();
      await fetchUsers({ silent: true });
      onChanged && onChanged();
      await successAlert("action.success", "User updated successfully.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (item) => {
    const confirmed = await confirmPopup(
      `Delete user ${item.username}? This cannot be undone.`
    );

    if (!confirmed?.isConfirmed) {
      return;
    }

    setDeletingId(item._id);
    setError("");

    try {
      await mainApi({
        url: `/user/${item._id}`,
        method: "DELETE",
      });

      if (editingId === item._id) {
        cancelEdit();
      }

      await fetchUsers({ silent: true });
      onChanged && onChanged();
      await successAlert("action.success", "User deleted successfully.");
    } catch (err) {
      setError(err);
      await errorAlert("action.error", err);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Manage Users</div>
      <div className="text-sm text-gray-500 mt-1">
        Search, review, and update existing users.
      </div>
      {error ? <div className="mt-2 text-sm text-red-500">{error}</div> : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Search</div>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username or name"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Role</div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="labeler">Labeler</option>
            <option value="examiner">Examiner</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 text-sm text-gray-500">Loading...</div>
      ) : filteredItems.length < 1 ? (
        <div className="mt-4 text-sm text-gray-500">No users found.</div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="px-3 py-3 font-medium">Username</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">First Name</th>
                <th className="px-3 py-3 font-medium">Last Name</th>
                <th className="px-3 py-3 font-medium">Password Reset</th>
                <th className="px-3 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isEditing = editingId === item._id;
                const isCurrentUser = user?.id === item._id;
                const isDeleting = deletingId === item._id;

                return (
                  <tr key={item._id} className="border-b align-top">
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(event) => updateField("username", event.target.value)}
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        <div className="font-medium">{item.username}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          value={editForm.role}
                          onChange={(event) => updateField("role", event.target.value)}
                          className="border rounded px-3 py-2"
                        >
                          <option value="admin">Admin</option>
                          <option value="labeler">Labeler</option>
                          <option value="examiner">Examiner</option>
                        </select>
                      ) : (
                        item.role
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.firstname}
                          onChange={(event) => updateField("firstname", event.target.value)}
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        item.firstname || "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.lastname}
                          onChange={(event) => updateField("lastname", event.target.value)}
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        item.lastname || "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(event) => updateField("password", event.target.value)}
                          placeholder="Optional new password"
                          className="border rounded px-3 py-2"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => saveUser(item._id)}
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
                            onClick={() => removeUser(item)}
                            disabled={!!editingId || isCurrentUser || isDeleting}
                            title={
                              isCurrentUser
                                ? "You cannot delete your own account."
                                : undefined
                            }
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

export default UserManagementSection;
