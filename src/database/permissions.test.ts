import capability from "../../src-tauri/capabilities/default.json";
import { expect, it } from "vitest";

it("grants main window SQL writes needed to create tasks and routine logs", () => {
  expect(capability.windows).toContain("main");
  expect(capability.permissions).toContain("sql:allow-execute");
});
