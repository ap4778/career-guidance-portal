export class HttpError extends Error {
  constructor(status, message, code = "REQUEST_FAILED", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

export function sendData(response, data, status = 200) {
  return response.status(status).json({ success: true, data });
}

export function errorHandler(error, request, response, _next) {
  if (error.type === "entity.too.large") {
    return response.status(413).json({ success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." } });
  }
  if (error.code === "ER_DUP_ENTRY") {
    return response.status(409).json({ success: false, error: { code: "DUPLICATE_ENTRY", message: "A record with that value already exists." } });
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return response.status(404).json({ success: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "A related record was not found." } });
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("Unhandled API error:", error);
  return response.status(status).json({
    success: false,
    error: {
      code: error.code || (status === 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"),
      message: status === 500 ? "An unexpected server error occurred." : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
