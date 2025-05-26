import Root from "../models/root";
import { table } from "../utils/db";
import { createLog } from "./log";

export const getRootById = (request) => {
  const id = request.params.id;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл харсан", "read");

  return Root.findOne({ _id: id });
};

const addRoot = (request) => {
  let { body } = request;
  // console.log("🚀 ~ addUser ~ body:", body);

  // createLog(request, "user", "Хэрэглэгч нэмсэн", "insert");
  return new Root(body).save();
};

const updateRootById = (request) => {
  const id = request.params.id;
  const { body } = request;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл өөрчилсөн", "update");

  return Root.findByIdAndUpdate(id, body);
};
const deleteRootById = (request) => {
  const id = request.params.id;

  // createLog(request, "user", "Хэрэглэгчийн мэдээлэл устгасан", "delete");

  return Root.deleteOne({
    _id: id,
  });
};

const getRootTable = async (request) => {
  // createLog(request, "root", "Хэрэглэгчийн жагсаалт харсан", "table");
  const { body } = request;
  return table(Root, body, {
    chain: (base) => base,
  });
};

export { getRootTable, addRoot, updateRootById, deleteRootById };
