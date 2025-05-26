import isEmpty from "is-empty";
import User from "../models/user";
import { table } from "../utils/db";
import jwt from "jsonwebtoken";
import { EXPIRE, JWT, SECRET } from "../consts";
import { createLog } from "./log";
import { request } from "http";
import sha256 from "crypto-js/sha256";
import { Exception } from "../utils/logger";

const Login = async (request) => {
  const { username, password } = request.body;
  createLog(request, "user", "Системд нэвтрэв", "login");
  if (isEmpty(username) && isEmpty(password)) {
    return {
      success: false,
      message: "Хэрэглэгчдийн нэр эсвэл нууц үгээ оруулна уу.!!!",
    };
  } else {
    const result = await User.findOne({
      username: username.toUpperCase(),
      password: password,
    });

    if (result) {
      const {
        role,
        department,
        rank,
        position,
        _id,
        firstname,
        lastname,
        permissions,
        profile,
        app,
        group,
        grouplist,
      } = result;

      let user = {
        username: result.username,
        firstname: firstname,
        lastname: lastname,
        role: role,
        department: department,
        rank: rank,
        position: position,
        id: _id,
        permissions: permissions,
        app: app,
        profile: profile[0]?.id,
        group: group,
        grouplist: grouplist,
      };

      const token = jwt.sign(user, SECRET, EXPIRE);

      return {
        success: true,
        token: token,
        user: user,
      };
    } else throw new Exception(`Хэрэглэгчийн мэдээлэл олдсонгүй`);
  }
};
export const getUserById = (request) => {
  const id = request.params.id;

  createLog(request, "user", "Хэрэглэгчийн мэдээлэл харсан", "read");

  return User.findOne({ _id: id });
};

const addUser = (request) => {
  let { body } = request;
  console.log("🚀 ~ addUser ~ body:", body);

  createLog(request, "user", "Хэрэглэгч нэмсэн", "insert");
  return new User(body).save();
};

const updateUserById = (request) => {
  const id = request.params.id;
  const { body } = request;

  createLog(request, "user", "Хэрэглэгчийн мэдээлэл өөрчилсөн", "update");

  return User.findByIdAndUpdate(id, body);
};
const deleteUserById = (request) => {
  const id = request.params.id;

  createLog(request, "user", "Хэрэглэгчийн мэдээлэл устгасан", "delete");

  return User.deleteOne({
    _id: id,
  });
};

const getUserTable = async (request) => {
  createLog(request, "user", "Хэрэглэгчийн жагсаалт харсан", "table");
  const { body } = request;
  return table(User, body, {
    chain: (base) => base,
  });
};

export { Login, getUserTable, addUser, updateUserById, deleteUserById };
