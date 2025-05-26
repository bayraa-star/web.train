import bunyan from "bunyan";
import { PROJECT_NAME } from "../consts";
const log = bunyan.createLogger({
  name: PROJECT_NAME,
  streams: [
    {
      level: "info",
      stream: process.stdout, // log INFO and above to stdout
    },
    {
      level: "error",
      path: `/var/tmp/${PROJECT_NAME}-error.log`, // log ERROR and above to a file
    },
  ],
});

class Exception extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
  }
}

class Unauthorized extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
  }
}

class MultipleException extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
  }
}

const requestDestructor = (request) => ({
  request_id: request.id,
});

export { log, requestDestructor, MultipleException, Unauthorized, Exception };
