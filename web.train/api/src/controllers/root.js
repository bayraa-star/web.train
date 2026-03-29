import {
  addRoot,
  updateRootById,
  getRootById,
  getRootTable,
  deleteRootById,
} from "../services/root";

export const create = async (request, response) => {
  const root = await addRoot(request);

  return response.json(root);
};

export const update = async (request, response) => {
  const root = await updateRootById(request);

  return response.json(root);
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
