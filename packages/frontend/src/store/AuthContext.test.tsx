import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

const AUTH_TOKEN_STORAGE_KEY = "auth.token";
const AUTH_USER_STORAGE_KEY = "auth.user";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createToken(
  overrides: Partial<{ userId: number; organizationId: number; admin: boolean }> = {},
) {
  return [
    encodeBase64Url({ alg: "HS256", typ: "JWT" }),
    encodeBase64Url({
      userId: 7,
      organizationId: 13,
      admin: true,
      ...overrides,
    }),
    "signature",
  ].join(".");
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function AuthConsumer() {
  const { signin, signout, token, user } = useAuth();

  return (
    <div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="user-name">{user?.name ?? "none"}</div>
      <div data-testid="organization-name">{user?.organizationName ?? "none"}</div>
      <div data-testid="organization-id">{user?.organizationId ?? "none"}</div>
      <button onClick={() => void signin("jane@example.com", "password123")} type="button">
        Sign in
      </button>
      <button onClick={() => signout()} type="button">
        Sign out
      </button>
      <button onClick={() => void fetch("/api/ticket-types")} type="button">
        Load protected resource
      </button>
    </div>
  );
}

function renderWithProvider() {
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("provides a null user when no token exists in localStorage", () => {
    renderWithProvider();

    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user-name")).toHaveTextContent("none");
  });

  it("restores user state from the stored token on mount", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken({ organizationId: 22 }));
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        name: "Restored User",
        organizationName: "Restored Org",
      }),
    );

    renderWithProvider();

    expect(screen.getByTestId("user-name")).toHaveTextContent("Restored User");
    expect(screen.getByTestId("organization-name")).toHaveTextContent("Restored Org");
    expect(screen.getByTestId("organization-id")).toHaveTextContent("22");
  });

  it("signin stores the token in localStorage and updates the user state", async () => {
    const token = createToken({ userId: 99, organizationId: 101, admin: false });

    fetchMock.mockResolvedValue(
      createJsonResponse({
        token,
        user: {
          userId: 99,
          name: "Jane Doe",
          admin: false,
          organizationName: "Acme Corp",
        },
      }),
    );

    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByTestId("user-name")).toHaveTextContent("Jane Doe"),
    );

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(token);
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toContain("Acme Corp");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/api/signin");
    await expect(request.clone().json()).resolves.toEqual({
      email: "jane@example.com",
      password: "password123",
    });
  });

  it("signout removes the token from localStorage, clears state, and redirects to /signin", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken());
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        name: "Signed In User",
        organizationName: "Acme Corp",
      }),
    );

    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
    expect(window.location.pathname).toBe("/signin");
  });

  it("useAuth exposes the current auth state", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken({ userId: 55 }));
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        name: "Visible User",
        organizationName: "Visible Org",
      }),
    );

    renderWithProvider();

    expect(screen.getByTestId("token")).not.toHaveTextContent("none");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Visible User");
    expect(screen.getByTestId("organization-name")).toHaveTextContent("Visible Org");
  });

  it("triggers signout globally when an authenticated api request returns 401", async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken());
    localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({
        name: "Expired User",
        organizationName: "Acme Corp",
      }),
    );
    fetchMock.mockResolvedValue(createJsonResponse({ message: "Token expired" }, 401));

    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: /load protected resource/i }));

    await waitFor(() =>
      expect(screen.getByTestId("token")).toHaveTextContent("none"),
    );

    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.location.pathname).toBe("/signin");
  });
});
