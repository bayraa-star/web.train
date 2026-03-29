import Root from "../models/root";
import { table } from "../utils/db";
import { createLog } from "./log";

const isAdmin = (user) => user?.role === "admin";

const getRootReadScope = () => ({});

const getRootWriteScope = (user) => {
  if (isAdmin(user)) return {};

  return {
    createdby: user?.id,
  };
};

export const getAccessibleRootById = (id, user, { write = false } = {}) => {
  return Root.findOne({
    _id: id,
    ...(write ? getRootWriteScope(user) : getRootReadScope(user)),
  });
};

export const getRootById = (request) => {
  const id = request.params.id;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл харсан", "read");

  return getAccessibleRootById(id, request.user);
};

const addRoot = (request) => {
  const { body } = request;
  // console.log("🚀 ~ addUser ~ body:", body);

  // createLog(request, "user", "Хэрэглэгч нэмсэн", "insert");
  const root = new Root(body);

  if (!root.directory) {
    root.directory = root._id.toString();
  }

  return root.save();
};

const updateRootById = (request) => {
  const id = request.params.id;
  const { body } = request;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл өөрчилсөн", "update");

  return Root.findOneAndUpdate(
    {
      _id: id,
      ...getRootWriteScope(request.user),
    },
    body,
    { new: true }
  );
};
const deleteRootById = (request) => {
  const id = request.params.id;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл устгасан", "delete");

  return Root.deleteOne({
    _id: id,
    ...getRootWriteScope(request.user),
  });
};

const getRootTable = async (request) => {
  // createLog(request, "root", "Хэрэглэгчийн жагсаалт харсан", "table");
  const { body } = request;
  const scope = getRootReadScope(request.user);

  return table(
    Root,
    {
      ...body,
      find: {
        ...(body?.find || {}),
        ...scope,
      },
    },
    {
      chain: (base) => base,
    }
  );
};

export { getRootTable, addRoot, updateRootById, deleteRootById };
