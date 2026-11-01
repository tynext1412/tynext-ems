import { describe, expect, it } from "vitest";
import { displayNameFromEmail, validateCredentials } from "./auth";

describe("validateCredentials", () => {
  it("requires a valid email and a password of at least 6 characters", () => {
    expect(validateCredentials({ email: "", password: "" })).toEqual({ email: "Enter a valid email address.", password: "Password must be at least 6 characters." });
    expect(validateCredentials({ email: "ops@tynext", password: "rahasia" })).toHaveProperty("email");
    expect(validateCredentials({ email: "ops@tynext.id", password: "12345" })).toHaveProperty("password");
    expect(validateCredentials({ email: " ops@tynext.id ", password: "rahasia" })).toEqual({});
  });
});

describe("displayNameFromEmail", () => {
  it("title-cases the local part split on dots, underscores and dashes", () => {
    expect(displayNameFromEmail("siti.rahma@tynext.id")).toBe("Siti Rahma");
    expect(displayNameFromEmail("ops_team-bali@x.id")).toBe("Ops Team Bali");
    expect(displayNameFromEmail("@x.id")).toBe("User");
  });
});
