import {
  addJob,
  updateJobById,
  getJobById,
  getJobTable,
  deleteJobById,
} from "../services/job";

export const create = async (request, response) => {
  return response.json(await addJob(request));
};

export const update = async (request, response) => {
  return response.json(await updateJobById(request));
};

export const read = async (request, response) => {
  return response.json(await getJobById(request).lean());
};

export const table = async (request, response) => {
  return response.json(await getJobTable(request));
};

export const deleteJob = async (request, response) => {
  return response.json(await deleteJobById(request));
};
