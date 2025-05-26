import {
  Login,
  addUser,
  updateUserById,
  getUserById,
  getUserTable,
  deleteUserById,
} from "../services/user";

export const login = async (request, response) => {
  return response.json(await Login(request));
};

export const create = async (request, response) => {
  await addUser(request);

  return response.send();
};

export const update = async (request, response) => {
  await updateUserById(request);

  return response.send();
};

export const read = async (request, response) => {
  return response.json(await getUserById(request).lean());
};

export const table = async (request, response) => {
  return response.json(await getUserTable(request));
};

export const deleteUser = async (request, response) => {
  return response.json(await deleteUserById(request));
};
