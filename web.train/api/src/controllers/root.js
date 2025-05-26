import {
  addRoot,
  updateRootById,
  getRootById,
  getRootTable,
  deleteRootById,
} from "../services/root";

export const create = async (request, response) => {
  await addRoot(request);

  return response.send();
};

export const update = async (request, response) => {
  await updateRootById(request);

  return response.send();
};

export const read = async (request, response) => {
  return response.json(await getRootById(request).lean());
};

export const table = async (request, response) => {
  return response.json(await getRootTable(request));
};

export const deleteRoot = async (request, response) => {
  return response.json(await deleteRootById(request));
};
