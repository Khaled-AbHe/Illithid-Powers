import { describe, expect, it } from "vitest";
import { andList, orList, plural } from "./util";

describe("dm util", () => {
  it("pluralizes", () => {
    expect(plural(0, "vial")).toBe("0 vials");
    expect(plural(1, "vial")).toBe("1 vial");
    expect(plural(6, "power")).toBe("6 powers");
  });
  it("joins names with 'or'", () => {
    expect(orList([])).toBe("");
    expect(orList(["A"])).toBe("A");
    expect(orList(["A", "B"])).toBe("A or B");
    expect(orList(["A", "B", "C"])).toBe("A, B or C");
  });
  it("joins names with 'and'", () => {
    expect(andList(["A"])).toBe("A");
    expect(andList(["A", "B"])).toBe("A and B");
    expect(andList(["A", "B", "C"])).toBe("A, B and C");
  });
});
