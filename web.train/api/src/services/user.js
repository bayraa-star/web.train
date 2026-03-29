import isEmpty from "is-empty";
import User from "../models/user";
import File from "../models/file";
import { table } from "../utils/db";
import jwt from "jsonwebtoken";
import { EXPIRE, JWT, SECRET } from "../consts";
import { createLog } from "./log";
import sha256 from "crypto-js/sha256";
import { Exception, Unauthorized } from "../utils";

const ALLOWED_LOGIN_ROLES = ["admin", "labeler", "examiner"];

const isHashedPassword = (value = "") => /^[a-f0-9]{64}$/i.test(value);

const normalizePassword = (value = "") => {
  if (!value) return value;

  return isHashedPassword(value) ? value.toLowerCase() : sha256(value).toString();
};

const Login = async (request) => {
  const { username, password } = request.body;
  createLog(request, "user", "Системд нэвтрэв", "login");
  if (isEmpty(username) || isEmpty(password)) {
    return {
      success: false,
      message: "Хэрэглэгчдийн нэр эсвэл нууц үгээ оруулна уу.!!!",
    };
  } else {
    const result = await User.findOne({
      username: username.toUpperCase(),
      password: normalizePassword(password),
    });

    if (result) {
      if (!ALLOWED_LOGIN_ROLES.includes(result.role)) {
        throw new Unauthorized("Зөвшөөрөгдсөн хэрэглэгч биш байна");
      }

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
    } else throw new Unauthorized(`Хэрэглэгчийн мэдээлэл олдсонгүй`);
  }
};
export const getUserById = (request) => {
  const id = request.params.id;

  createLog(request, "user", "Хэрэглэгчийн мэдээлэл харсан", "read");

  return User.findOne({ _id: id });
};

const addUser = (request) => {
  let { body } = request;

  createLog(request, "user", "Хэрэглэгч нэмсэн", "insert");

  return new User({
    ...body,
    username: body?.username?.toUpperCase(),
    password: normalizePassword(body?.password),
  }).save();
};

const updateUserById = (request) => {
  const id = request.params.id;
  const { body } = request;

  const payload = {
    ...body,
  };

  if (payload?.username) {
    payload.username = payload.username.toUpperCase();
  }

  if (payload?.password) {
    payload.password = normalizePassword(payload.password);
  }

  createLog(request, "user", "Хэрэглэгчийн мэдээлэл өөрчилсөн", "update");

  return User.findByIdAndUpdate(id, payload);
};
const deleteUserById = async (request) => {
  const id = request.params.id;

  if (request?.user?.id === id) {
    throw new Exception("You cannot delete your own account");
  }

  const linkedFile = await File.findOne({
    $or: [
      { assignedTo: id },
      { labeledBy: id },
      { approvedBy: id },
      { declinedBy: id },
      { deletedBy: id },
    ],
  }).lean();

  if (linkedFile) {
    throw new Exception("This user cannot be deleted because files are linked to it");
  }

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
