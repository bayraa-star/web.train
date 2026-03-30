import Validator, { array, string } from "./_common";

export const createValidator = Validator(
  {
    name: string({ min: 1, max: 250 }),
    description: string({ optional: true }),
    taskType: array(["ocr", "ocr_detection", "detection"], { optional: true }),
  },
  ["admin"]
);

export const updateValidator = Validator(
  {
    name: string({ optional: true, min: 1, max: 250 }),
    description: string({ optional: true }),
    taskType: array(["ocr", "ocr_detection", "detection"], { optional: true }),
  },
  ["admin"]
);

export const readValidator = Validator({}, ["admin", "examiner"], {
  audit: false,
});

export const tableValidator = Validator({}, ["admin", "examiner", "labeler"], {
  audit: false,
});

export const deleteValidator = Validator({}, ["admin"], {
  audit: false,
});
