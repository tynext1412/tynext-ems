import { describe, expect, it } from "vitest";
import { displayNameFromEmail, EMAIL_INVALID, EMAIL_REQUIRED, PASSWORD_HINT, PASSWORD_REQUIRED, PASSWORDS_DIFFER, validateCredentials, validateEmail, validateNewPassword } from "./auth";

describe("validateCredentials", () => {
  it("checks required fields and the email format, leaving password rules to the server", () => {
    expect(validateCredentials({ email: "", password: "" })).toEqual({ email: EMAIL_REQUIRED, password: PASSWORD_REQUIRED });
    expect(validateCredentials({ email: "dadang@tynext", password: "x" })).toEqual({ email: EMAIL_INVALID });
    expect(validateCredentials({ email: " ops@tynext.id ", password: "123" })).toEqual({});
  });

  it("treats a whitespace-only email as empty", () => {
    expect(validateEmail("   ")).toBe(EMAIL_REQUIRED);
    expect(validateEmail(" ops@tynext.co.id ")).toBeUndefined();
  });
});

describe("validateNewPassword", () => {
  it("needs at least 10 characters (the backend rule) and a matching confirmation", () => {
    expect(PASSWORD_HINT).toBe("Use at least 10 characters.");
    expect(validateNewPassword("SolarPlant", "SolarPlant")).toEqual({});
    expect(validateNewPassword("Plant2026", "Plant2026")).toEqual({ password: true }); // 9 karakter
    expect(validateNewPassword("SolarPlant2026", "SolarPlant2025")).toEqual({ confirm: PASSWORDS_DIFFER });
    expect(validateNewPassword("SolarPlant2026", "")).toEqual({ confirm: PASSWORDS_DIFFER });
  });
});

describe("displayNameFromEmail", () => {
  it("title-cases the local part split on dots, underscores and dashes", () => {
    expect(displayNameFromEmail("siti.rahma@tynext.id")).toBe("Siti Rahma");
    expect(displayNameFromEmail("ops_team-bali@x.id")).toBe("Ops Team Bali");
    expect(displayNameFromEmail("@x.id")).toBe("User");
  });
});
