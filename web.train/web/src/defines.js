import packageJson from "../package.json";

export const DEBUG = process.env.NODE_ENV === "development";
// export const XYP = DEBUG ? "http://vil.odt.mn:5002" : "http://localhost:5002";

export const API_ROOT = DEBUG
  ? "http://localhost:5001"
  : "http://103.9.90.140:5001";
// export const API_ROOT = "http://103.9.90.140:5001";
export const VERSION = packageJson.version;
export const YEAR = () => {
  return new Date().getFullYear();
};
export const DATE_FORMAT = "yyyy-MM-DD HH:mm:ss";
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"];

export const PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.rus3";
export const APP_STORE =
  "https://apps.apple.com/mn/app/орос-3-мохс/id1670782481";

export const WEEKDAY = {
  0: "08:00 - 08:40",
  1: "08:45 - 09:25",
  2: "09:35 - 10:15",
  3: "10:35 - 11:15",
  4: "11:35 - 12:15",
  5: "12:20 - 13:00",
  6: "13:05 - 13:45",
  7: "13:50 - 14:30",
  8: "14:50 - 15:30",
  9: "15:35 - 16:15",
  10: "16:20 - 17:00",
  11: "17:05 - 17:45",
};

export const WEEKEND = {
  0: "09:00 - 09:40",
  1: "09:45 - 10:25",
  2: "10:35 - 11:15",
  3: "11:35 - 12:15",
  4: "12:35 - 13:15",
  5: "13:20 - 14:00",
  6: "14:05 - 14:45",
  7: "14:50 - 15:30",
  8: "15:50 - 16:30",
  9: "16:35 - 17:15",
  10: "17:20 - 18:00",
  11: "18:05 - 18:45",
};
