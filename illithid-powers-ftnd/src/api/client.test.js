import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  api,
  ApiError,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "./client";

const respond = (status, body) =>
  Promise.resolve(
    new Response(body === undefined ? "" : JSON.stringify(body), { status })
  );

describe("api client", () => {
  beforeEach(() => setUnauthorizedHandler(null));

  it("stores and clears the token in localStorage", () => {
    expect(getToken()).toBeNull();
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("sends the bearer token and JSON bodies", async () => {
    setToken("tok");
    const fetchMock = vi.fn(() => respond(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await api.post("/x", { a: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/x$/);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("omits Authorization when logged out", async () => {
    const fetchMock = vi.fn(() => respond(200, {}));
    vi.stubGlobal("fetch", fetchMock);
    await api.get("/x");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("throws ApiError carrying status, code and the server's message", async () => {
    vi.stubGlobal("fetch", () =>
      respond(403, { message: "Not enough vials", code: "NOT_ENOUGH_VIALS" })
    );
    const err = await api.post("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 403,
      code: "NOT_ENOUGH_VIALS",
      message: "Not enough vials",
    });
  });

  it("joins validation message arrays", async () => {
    vi.stubGlobal("fetch", () =>
      respond(400, { message: ["a is required", "b is too short"] })
    );
    const err = await api.post("/x").catch((e) => e);
    expect(err.message).toBe("a is required, b is too short");
  });

  it("reports an unreachable server as status 0", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("fetch failed")));
    const err = await api.get("/x").catch((e) => e);
    expect(err).toMatchObject({ status: 0 });
    expect(err.message).toMatch(/can't reach the server/i);
  });

  it("calls the unauthorized handler on a 401 when a token was sent", async () => {
    setToken("stale");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", () =>
      respond(401, { message: "Invalid or expired token" })
    );
    await api.get("/me").catch(() => {});
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not treat a wrong password on login as an expired session", async () => {
    setToken("stale");
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal("fetch", () =>
      respond(401, { message: "Invalid username or password" })
    );
    await api.post("/auth/login", {}).catch(() => {});
    expect(handler).not.toHaveBeenCalled();
  });
});
