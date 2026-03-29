import Validator, { array, string } from "./_common";

const fields = {
  username: string({ optional: true, min: 1, max: 100 }),
  password: string({ optional: true, min: 1, max: 500 }),
  role: array(["admin", "labeler", "examiner"], { optional: true }),
  firstname: string({ optional: true }),
  lastname: string({ optional: true }),
  phone: string({ optional: true }),
  department: string({ optional: true }),
  rank: string({ optional: true }),
  position: string({ optional: true }),
};

export const createValidator = Validator(
  {
    ...fields,
    username: string({ min: 1, max: 100 }),
    password: string({ min: 1, max: 500 }),
    role: array(["admin", "labeler", "examiner"]),
  },
  null,
  {
  auth: false,
  audit: false,
  }
);
export const updateValidator = Validator(fields, ["admin"]);
export const readValidator = Validator({}, ["admin"], { audit: false });
export const tableValidator = Validator({}, ["admin"], { audit: false });
export const deleteValidator = Validator({}, ["admin"]);
