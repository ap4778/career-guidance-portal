import { validationResult } from "express-validator";
import { HttpError } from "../utils/http.js";

export function validateRequest(request, _response, next) {
  const result = validationResult(request);
  if (!result.isEmpty()) {
    return next(new HttpError(422, "Please correct the highlighted input fields.", "VALIDATION_ERROR", result.array().map(({ path, msg }) => ({ field: path, message: msg }))));
  }
  return next();
}
