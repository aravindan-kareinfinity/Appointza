import { describe, expect, it } from "vitest";
import {
  applyPreviewValues,
  collectPlaceholderIndexes,
  statusLabel,
} from "@/utils/whatsappTemplate.util";

describe("whatsappTemplate.util", () => {
  it("substitutes preview placeholders without mutating source", () => {
    const source = "Hello {{1}}, see you on {{2}}";
    expect(applyPreviewValues(source, { "1": "Ada", "2": "Monday" })).toBe(
      "Hello Ada, see you on Monday",
    );
    expect(source).toContain("{{1}}");
  });

  it("collects sequential placeholder indexes", () => {
    expect(collectPlaceholderIndexes("A {{2}} B {{1}}")).toEqual([1, 2]);
  });

  it("labels statuses without inventing approval", () => {
    expect(statusLabel("pending")).toBe("Pending approval");
    expect(statusLabel("draft")).toBe("Local draft");
    expect(statusLabel("approved")).toBe("Approved");
  });
});
