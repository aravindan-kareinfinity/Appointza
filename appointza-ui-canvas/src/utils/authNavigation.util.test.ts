import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_RETURN_STORAGE_KEY,
  buildLoginReturnValue,
  isMainAppBookingPath,
  resolveLoginReturnPath,
  stashAuthReturnPath,
  toRelativeAppPath,
} from "@/utils/authNavigation.util";

describe("authNavigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.name = "";
  });

  it("detects booking paths on any host", () => {
    expect(isMainAppBookingPath("/book-appointment/26/29?serviceId=76")).toBe(true);
    expect(isMainAppBookingPath("https://shop.appointza.com/book-appointment/26/29")).toBe(true);
    expect(isMainAppBookingPath("/user/events/5/book")).toBe(true);
    expect(isMainAppBookingPath("/book")).toBe(true);
    expect(isMainAppBookingPath("/organization/dashboard")).toBe(false);
  });

  it("strips the origin but keeps query and hash", () => {
    expect(toRelativeAppPath("https://shop.appointza.com/book-appointment/26/29?serviceId=76#x")).toBe(
      "/book-appointment/26/29?serviceId=76#x",
    );
    expect(toRelativeAppPath("user/dashboard")).toBe("/user/dashboard");
    expect(toRelativeAppPath("")).toBe("/");
  });

  it("never returns an absolute subdomain URL as the login return value", () => {
    expect(
      buildLoginReturnValue("https://awonderonesurprise.appointza.com/book-appointment/26/29?serviceId=75"),
    ).toBe("/book-appointment/26/29?serviceId=75");
  });

  it("round-trips a stashed path through sessionStorage and clears it", () => {
    stashAuthReturnPath("/book-appointment/26/29?serviceId=76");
    expect(sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY)).toBe("/book-appointment/26/29?serviceId=76");

    expect(resolveLoginReturnPath({ search: "" })).toBe("/book-appointment/26/29?serviceId=76");
    expect(sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY)).toBeNull();
  });

  it("falls back to window.name when sessionStorage is empty (cross-subdomain hop)", () => {
    window.name = "appointza_return:/book-appointment/1/2";
    expect(resolveLoginReturnPath({ search: "" })).toBe("/book-appointment/1/2");
    expect(window.name).toBe("");
  });

  it("still honours a legacy ?from= query", () => {
    expect(resolveLoginReturnPath({ search: "?from=%2Fuser%2Fappointments" })).toBe("/user/appointments");
  });
});
