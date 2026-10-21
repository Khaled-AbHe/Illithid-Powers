const TOKEN_KEY = "illithidToken";

export const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Thrown for every failed request. `status` is 0 when the server can't be reached. */
export class ApiError extends Error {
  constructor(status, body) {
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    super(message ?? `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

let onUnauthorized = null;
/** AuthProvider registers this so an expired or revoked token logs the user out. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, {
      message: "Can't reach the server. Is the API running?",
    });
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    // A wrong password on the login form is a 401 too, but isn't an expired session.
    if (res.status === 401 && token && path !== "/auth/login") {
      onUnauthorized?.();
    }
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
