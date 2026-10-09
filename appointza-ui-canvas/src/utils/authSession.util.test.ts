import { beforeEach, describe, expect, it } from "vitest";
import {
  getAuthHeaders,
  getAuthToken,
  getStoredOrganisationId,
  getStoredUserContext,
  hasAuthSession,
} from "@/utils/authSession.util";

describe("authSession", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty values when logged out", () => {
    expect(getAuthToken()).toBe("");
    expect(getAuthHeaders()).toEqual({});
    expect(hasAuthSession()).toBe(false);
    expect(getStoredUserContext()).toBeNull();
    expect(getStoredOrganisationId()).toBe(0);
  });

  it("prefers the access token inside user_context", () => {
    localStorage.setItem("auth_token", "legacy");
    localStorage.setItem("user_context", JSON.stringify({ accesstoken: "ctx-token", organisationid: 26 }));
    expect(getAuthToken()).toBe("ctx-token");
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer ctx-token" });
    expect(getStoredOrganisationId()).toBe(26);
  });

  it("falls back to auth_token when user_context has no token", () => {
    localStorage.setItem("auth_token", "legacy");
    localStorage.setItem("user_context", JSON.stringify({ userid: 1 }));
    expect(getAuthToken()).toBe("legacy");
  });

  it("survives malformed user_context", () => {
    localStorage.setItem("auth_token", "legacy");
    localStorage.setItem("user_context", "{not json");
    expect(getStoredUserContext()).toBeNull();
    expect(getAuthToken()).toBe("legacy");
  });
});
