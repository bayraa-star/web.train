import { getLogById, getLogTable } from "../services/log";

export const read = async (request, response) => {
  return response.json(await getLogById(request).lean());
};

export const table = async (request, response) => {
  return response.json(await getLogTable(request));
};
