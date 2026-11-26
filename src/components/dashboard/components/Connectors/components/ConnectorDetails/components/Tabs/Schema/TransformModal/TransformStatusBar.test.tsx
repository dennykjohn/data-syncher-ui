/**
 * @vitest-environment jsdom
 */
import { type ComponentProps } from "react";

import { ChakraProvider } from "@chakra-ui/react";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import theme from "@/theme/theme";

import TransformStatusBar from "./TransformStatusBar";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

afterEach(() => {
  cleanup();
});

const history = [
  {
    id: 2,
    version: 2,
    is_active: true,
    status: "validated",
    created_at: "2026-01-02T00:00:00Z",
  },
  {
    id: 1,
    version: 1,
    is_active: false,
    status: "validated",
    created_at: "2026-01-01T00:00:00Z",
  },
];

function renderBar(
  props: Partial<ComponentProps<typeof TransformStatusBar>> = {},
) {
  const onSelectVersion = vi.fn();
  render(
    <ChakraProvider value={theme}>
      <TransformStatusBar
        hasServerDraft={false}
        isDirty={false}
        hasActive={false}
        publishedVersion={null}
        draftSaveLabel={null}
        history={[]}
        onSelectVersion={onSelectVersion}
        {...props}
      />
    </ChakraProvider>,
  );
  return { onSelectVersion };
}

describe("TransformStatusBar", () => {
  it("shows no validated version when there is no draft or active", () => {
    renderBar();
    expect(screen.getByText("No validated version")).toBeTruthy();
  });

  it("shows draft badge and autosave label for server draft", () => {
    renderBar({
      hasServerDraft: true,
      draftSaveLabel: "Draft saved",
    });
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("Draft saved")).toBeTruthy();
  });

  it("shows Applied badge with chevron when clean and applied", () => {
    renderBar({
      hasActive: true,
      publishedVersion: 3,
      history,
    });
    expect(screen.getByLabelText("Applied v3, show versions")).toBeTruthy();
    expect(screen.queryByText("Draft")).toBeNull();
  });

  it("opens a version from the history menu without an activate API", async () => {
    const { onSelectVersion } = renderBar({
      hasActive: true,
      publishedVersion: 2,
      history,
    });
    fireEvent.click(screen.getByLabelText("Applied v2, show versions"));
    const item = await screen.findByRole("menuitem", { name: /v1/i });
    fireEvent.click(item);
    await waitFor(() => {
      expect(onSelectVersion).toHaveBeenCalledWith(1);
    });
  });
});
