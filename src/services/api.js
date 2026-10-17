const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      body,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Could not reach the API. Confirm that the Express server is running.", 0, "NETWORK_ERROR");
  }
  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const isProxyFailure = response.status >= 500
      && (!responseText.trim() || !contentType.includes("application/json"));
    if (isProxyFailure) {
      throw new ApiError(
        "The backend API is not running. Copy backend/.env.example to backend/.env, configure your JWT secret and MySQL connection, then run `npm run dev:full`.",
        response.status,
        "API_UNAVAILABLE",
      );
    }
    throw new ApiError(`The API returned a non-JSON response (HTTP ${response.status}).`, response.status, "INVALID_RESPONSE");
  }
  if (!response.ok || result.success === false) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      window.dispatchEvent(new CustomEvent("careerpath:session-expired"));
    }
    throw new ApiError(
      result.error?.message || "The request could not be completed.",
      response.status,
      result.error?.code || "REQUEST_FAILED",
      result.error?.details,
    );
  }
  return result.data;
}

export { apiBaseUrl };
