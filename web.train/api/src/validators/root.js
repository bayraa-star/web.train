import Validator, { string } from "./_common";

export const createValidator = Validator(
  {
    root: string({ min: 1, max: 250 }),
    description: string({ optional: true }),
  },
  ["admin", "labeler"]
);

export const updateValidator = Validator(
  {
    root: string({ optional: true, min: 1, max: 250 }),
    description: string({ optional: true }),
  },
  ["admin", "labeler"]
);

export const readValidator = Validator({}, ["admin", "labeler"], {
  audit: false,
});

export const tableValidator = Validator({}, ["admin", "labeler"], {
  audit: false,
});

export const deleteValidator = Validator({}, ["admin", "labeler"], {
  audit: false,
});
