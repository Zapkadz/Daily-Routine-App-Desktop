// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Modal } from "./Modal";

it("renders the dialog inside its theme scope even through a portal", async () => {
  const host = document.createElement("div");
  host.className = "app-frame dark";
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => { root.render(<Modal title="New task" onClose={() => {}}><input /></Modal>); });
  expect(document.querySelector('[role="dialog"]')?.closest(".app-frame.dark")).toBe(host);
  await act(async () => root.unmount());
  host.remove();
});
