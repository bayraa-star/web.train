import { DEMO } from "../consts";
import Sms from "../models/sms";
import axios from "axios";

const TIMEOUT = 20000;

const MOBICOM = ["99", "95", "94", "85"];
const UNITEL = ["88", "89", "86", "80"];
const SKYTEL = ["96", "91", "90"];
const GMOBILE = ["98", "97", "93", "92", "83"];

const FETCH_OPERATOR_URL = async (url, options = {}) => {
  const abort = axios.CancelToken.source();
  const id = setTimeout(
    () => abort.cancel(`Мессеж илгээх ${TIMEOUT} миллисекунд хугацаа дууссан.`),
    TIMEOUT
  );
  return axios
    .get(url, { cancelToken: abort.token, ...options })
    .then((response) => {
      clearTimeout(id);
      return response;
    });
};

const GENERATE_OPERATOR_URL = (operator, phone, text) => {
  switch (operator) {
    // case "skytel":
    //   return `http://smsgw.skytel.mn:80/SMSGW-war/pushsms?src=144441&id=1000086&text=${text}&dest=${phone}`;
    case "unitel":
      return `http://sms.unitel.mn/sendSMS.php?uname=ODT&upass=Unitel88&sms=${text}&from=138899&mobile=${phone}`;
    // case "gmobile":
    //   return `http://203.91.114.131/cgi-bin/sendsms?from=144441&username=ozzo_41&password=ozzo_144&text=${text}&to=${phone}`;
    // case "mobicom":
    //   return `http://27.123.214.168/smsmt/mt?servicename=ozzo&username=ozzo&from=144441&to=${phone}&msg=${text}`;
    default:
      return null;
  }
};

const SUCCESS = {
  skytel: "OK",
  unitel: "SUCCESS",
  gmobile: "0: Accepted for delivery",
  mobicom: "Sent",
};

const CHECK_OPERATOR = (phone) => {
  if (!phone) return null;
  if (!phone.match(/^[0-9]{8}$/)) return null;

  let prefix = "";

  try {
    prefix = phone.substring(0, 2);
  } catch {}

  if (MOBICOM.includes(prefix)) return "mobicom";
  if (UNITEL.includes(prefix)) return "unitel";
  if (SKYTEL.includes(prefix)) return "skytel";
  if (GMOBILE.includes(prefix)) return "gmobile";

  return null;
};

const GENERATE_URL = (operator, phone, text) => {
  if (!operator)
    throw new Error(`Харгалзах оператор компани олдсонгүй: ${phone}`);

  const url = GENERATE_OPERATOR_URL(operator, phone, text);
  if (!url)
    throw new Error(`"${operator}" холболтын тохиргоо байхгүй ${phone}`);

  return url;
};

export const send = async (p, text) => {
  const phone = DEMO ? "99994983" : p;

  let operator = CHECK_OPERATOR(phone);
  let meta = { phone, text, operator };

  try {
    if (text.length > 160)
      throw new Error(`Текстийн урт 160-с хэтэрсэн байна!`);

    let url = GENERATE_URL(operator, phone, text);
    let result = await FETCH_OPERATOR_URL(url);

    if (result.data != SUCCESS[operator]) throw new Error(result.data);

    await new Sms({
      ...meta,
      status: "Амжилттай",
      payload: result.data,
    }).save();

    return 1;
  } catch (error) {
    await new Sms({
      ...meta,
      status: "Амжилтгүй",
      payload: error.message || error.toString(),
    }).save();

    return error.toString();
  }
};
