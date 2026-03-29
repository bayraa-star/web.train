const log = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

class Exception extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
    this.status = 400;
  }
}

class Unauthorized extends Error {
  constructor(message, payload) {
    super(message);
    this.payload = payload;
    this.status = 401;
  }
}

class MultipleException extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
    this.status = 400;
  }
}

const requestDestructor = (request) => ({
  request_id: request.id,
});

export { log, requestDestructor, MultipleException, Unauthorized, Exception };
