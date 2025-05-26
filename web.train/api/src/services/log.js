import Log from "../models/log";
import { table } from "../utils/db";

export const createLog = (request, model, info, type) => {
  return new Log({
    ...requestExtractor(request),
    info: info,
    type: type,
    model: model,
    createdby: request?.user?.id,
    created: new Date(),
  }).save();
};

export const getLogById = (request) => {
  const id = request.params.id;

  createLog(request, "log", "Лог мэдээлэл харсан", "read");

  return Log.findOne({ _id: id });
};

export const getLogTable = async (request) => {
  const { body } = request;

  createLog(request, "log", "Лог жагсаалт харсан", "table");
  return table(Log, body, {
    chain: (base) => base.populate(["user", "createdby"]),
  });
};

const requestExtractor = (request) => {
  const req = {
    user: request?.user?.id,
    originalUrl: request.originalUrl,
    method: request.method,
    useragent: request.useragent,
    params: JSON.stringify(request.params),
    query: JSON.stringify(request.query),
    body: JSON.stringify(request.body),
    ip: request.socket?.remoteAddress,
  };

  return req;
};
