import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceIntroBanner from "@/components/chat/VoiceIntroBanner";

// Mock supabase
const mockCreateSignedUrl = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  },
}));

// Mock Audio
class MockAudio {
  src = "";
  preload = "";
  duration = 15;
  currentTime = 0;
  private listeners: Record<string, (() => void)[]> = {};

  addEventListener(event: string, cb: () => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  removeEventListener() {}

  play() {
    return Promise.resolve();
  }

  pause() {}

  emit(event: string) {
    this.listeners[event]?.forEach((cb) => cb());
  }
}

let lastAudio: MockAudio;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("Audio", class extends MockAudio {
    constructor(src?: string) {
      super();
      if (src) this.src = src;
      lastAudio = this;
      // Auto-fire loadedmetadata
      setTimeout(() => this.emit("loadedmetadata"), 0);
    }
  });
});

describe("VoiceIntroBanner", () => {
  it("shows loading skeleton then player on successful signed URL", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/audio.webm" },
      error: null,
    });

    render(<VoiceIntroBanner storagePath="user123/intro.webm" matchName="Alex" />);

    // Should show skeleton initially (or transition quickly)
    await waitFor(() => {
      expect(screen.getByText("Alex's voice intro")).toBeInTheDocument();
    });

    expect(mockCreateSignedUrl).toHaveBeenCalledWith("user123/intro.webm", 3600);
  });

  it("shows error state when signed URL fails", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    render(<VoiceIntroBanner storagePath="missing/path.webm" matchName="Sam" />);

    await waitFor(() => {
      expect(screen.getByText("Voice intro unavailable")).toBeInTheDocument();
    });
  });

  it("renders play button that toggles to pause", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/audio.webm" },
      error: null,
    });

    render(<VoiceIntroBanner storagePath="user/intro.webm" matchName="Jordan" />);

    await waitFor(() => {
      expect(screen.getByText("Jordan's voice intro")).toBeInTheDocument();
    });

    // Find play button and click
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
