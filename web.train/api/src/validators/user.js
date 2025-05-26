import Validator from "./_common";

export const createValidator = Validator({}, ["admin", "operator"]);
export const updateValidator = Validator({}, ["admin", "operator"]);
export const readValidator = Validator({}, ["admin", "operator"]);
export const tableValidator = Validator({}, ["admin", "operator"]);
export const deleteValidator = Validator({}, ["admin"]);
