import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import GuardianNet from "@/components/call/GuardianNet";

// Mock supabase
const mockInsert = vi.fn().mockReturnValue({ then: vi.fn() });
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: mockInsert,
    }),
  },
}));

// Mock useAuth
const mockUser = { id: "user-123" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockReturnValue({ then: vi.fn() });
});

describe("GuardianNet", () => {
  it("does not log when closed", () => {
    render(<GuardianNet open={false} onClose={() => {}} callId="call-abc" />);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("logs alert when opened with valid callId", async () => {
    render(<GuardianNet open={true} onClose={() => {}} callId="call-abc" />);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        call_id: "call-abc",
        user_id: "user-123",
      });
    });
  });

  it("only logs once per open (loggedRef guard)", async () => {
    const { rerender } = render(
      <GuardianNet open={true} onClose={() => {}} callId="call-abc" />
    );

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    // Re-render with same props — should not log again
    rerender(<GuardianNet open={true} onClose={() => {}} callId="call-abc" />);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("does not log when callId is empty", () => {
    render(<GuardianNet open={true} onClose={() => {}} callId="" />);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("resets loggedRef when closed then reopened", async () => {
    const { rerender } = render(
      <GuardianNet open={true} onClose={() => {}} callId="call-abc" />
    );

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    // Close
    rerender(<GuardianNet open={false} onClose={() => {}} callId="call-abc" />);

    // Reopen
    rerender(<GuardianNet open={true} onClose={() => {}} callId="call-abc" />);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });
  });
});
