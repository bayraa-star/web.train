import { useState } from "react";
import axios from "axios";
import { API_ROOT } from "../../defines";
import { errorAlert, successAlert } from "../../providers/alert";

const DEFAULT_FORM = {
  basicUsername: "",
  basicPassword: "",
  username: "",
  password: "",
  role: "labeler",
  firstname: "",
  lastname: "",
};

const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;

  return error?.toString?.() || "Unknown error";
};

const buildBasicAuthHeader = (username, password) => {
  return `Basic ${window.btoa(`${username}:${password}`)}`;
};

const UserCreateSection = ({ onCreated }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const createUser = async () => {
    const {
      basicUsername,
      basicPassword,
      username,
      password,
      role,
      firstname,
      lastname,
    } = form;

    if (!basicUsername || !basicPassword || !username || !password || !role) {
      const message = "Basic auth, username, password, and role are required.";
      setError(message);
      await errorAlert("action.error", message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios({
        url: `${API_ROOT}/user`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildBasicAuthHeader(basicUsername, basicPassword),
        },
        data: {
          username,
          password,
          role,
          firstname,
          lastname,
        },
      });

      setForm((previous) => ({
        ...DEFAULT_FORM,
        basicUsername: previous.basicUsername,
        basicPassword: previous.basicPassword,
      }));

      onCreated && onCreated(response?.data?.user);

      await successAlert(
        "action.success",
        `User "${response?.data?.user?.username || username.toUpperCase()}" created successfully.`
      );
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      await errorAlert("action.error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white shadow border rounded">
      <div className="text-lg font-semibold">Create User</div>
      <div className="text-sm text-gray-500 mt-1">
        Create admin, labeler, or examiner accounts from the frontend using the API basic-auth credentials.
      </div>
      {error ? <div className="mt-2 text-sm text-red-500">{error}</div> : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Basic Auth Username</div>
          <input
            type="text"
            value={form.basicUsername}
            onChange={(event) => setField("basicUsername", event.target.value)}
            placeholder="API basic auth username"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Basic Auth Password</div>
          <input
            type="password"
            value={form.basicPassword}
            onChange={(event) => setField("basicPassword", event.target.value)}
            placeholder="API basic auth password"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Username</div>
          <input
            type="text"
            value={form.username}
            onChange={(event) => setField("username", event.target.value)}
            placeholder="e.g. LABELER_01"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Password</div>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setField("password", event.target.value)}
            placeholder="User password"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Role</div>
          <select
            value={form.role}
            onChange={(event) => setField("role", event.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="admin">Admin</option>
            <option value="labeler">Labeler</option>
            <option value="examiner">Examiner</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">First Name</div>
          <input
            type="text"
            value={form.firstname}
            onChange={(event) => setField("firstname", event.target.value)}
            placeholder="Optional"
            className="border rounded px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Last Name</div>
          <input
            type="text"
            value={form.lastname}
            onChange={(event) => setField("lastname", event.target.value)}
            placeholder="Optional"
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        The basic-auth credentials must match `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` in the API environment.
      </div>

      <button
        type="button"
        onClick={createUser}
        disabled={loading}
        className="!w-auto mt-4 border px-6 py-2 rounded inline-flex disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </div>
  );
};

export default UserCreateSection;
