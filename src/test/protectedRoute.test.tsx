import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { Session } from "@supabase/supabase-js";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseFeatureFlags = vi.mocked(useFeatureFlags);
const mockSession = { user: { id: "user-1" } } as unknown as Session;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({
      data: { requirePhoneVerification: true },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useFeatureFlags>);
  });

  it("redirects unauthenticated users to /auth", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      isLoading: false,
      isAdmin: false,
      onboardingComplete: false,
      profile: null,
      user: null,
      userTrust: null,
      signOut: async () => {},
    });

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={<ProtectedRoute><div>Lobby</div></ProtectedRoute>}
          />
          <Route path="/auth" element={<div>Auth Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("redirects authenticated but incomplete users to /onboarding", () => {
    mockUseAuth.mockReturnValue({
      session: mockSession,
      isLoading: false,
      isAdmin: false,
      onboardingComplete: false,
      profile: null,
      user: null,
      userTrust: null,
      signOut: async () => {},
    });

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={<ProtectedRoute><div>Lobby</div></ProtectedRoute>}
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("renders children for authenticated and onboarded users", () => {
    mockUseAuth.mockReturnValue({
      session: mockSession,
      isLoading: false,
      isAdmin: false,
      onboardingComplete: true,
      profile: null,
      user: null,
      userTrust: {
        id: "trust-1",
        user_id: "user-1",
        age_verified: false,
        phone_verified: true,
        selfie_verified: true,
        safety_pledge_accepted: true,
        onboarding_step: 8,
        onboarding_complete: true,
        preferences: {},
      },
      signOut: async () => {},
    });

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={<ProtectedRoute><div>Lobby</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Lobby")).toBeInTheDocument();
  });

  it("enforces trust gate when requireTrust is true and phone is required", () => {
    mockUseAuth.mockReturnValue({
      session: mockSession,
      isLoading: false,
      isAdmin: false,
      onboardingComplete: true,
      profile: null,
      user: null,
      userTrust: {
        id: "trust-1",
        user_id: "user-1",
        age_verified: false,
        phone_verified: false,
        selfie_verified: true,
        safety_pledge_accepted: true,
        onboarding_step: 8,
        onboarding_complete: true,
        preferences: {},
      },
      signOut: async () => {},
    });

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={<ProtectedRoute requireTrust><div>Lobby</div></ProtectedRoute>}
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("allows trust gate pass without phone when policy disables phone requirement", () => {
    mockUseFeatureFlags.mockReturnValue({
      data: { requirePhoneVerification: false },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useFeatureFlags>);

    mockUseAuth.mockReturnValue({
      session: mockSession,
      isLoading: false,
      isAdmin: false,
      onboardingComplete: true,
      profile: null,
      user: null,
      userTrust: {
        id: "trust-1",
        user_id: "user-1",
        age_verified: false,
        phone_verified: false,
        selfie_verified: true,
        safety_pledge_accepted: true,
        onboarding_step: 8,
        onboarding_complete: true,
        preferences: {},
      },
      signOut: async () => {},
    });

    render(
      <MemoryRouter initialEntries={["/lobby"]}>
        <Routes>
          <Route
            path="/lobby"
            element={<ProtectedRoute requireTrust><div>Lobby</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Lobby")).toBeInTheDocument();
  });
});
