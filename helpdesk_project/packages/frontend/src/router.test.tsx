import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { appRoutes } from "./router";
import { AuthProvider } from "./store/AuthContext";
import { ThemeProvider } from "./store/ThemeContext";

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

function seedSession({
  admin = true,
  name = "Jane Doe",
  organizationName = "Acme Corp",
}: {
  admin?: boolean;
  name?: string;
  organizationName?: string;
} = {}) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken({ admin }));
  localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify({
      name,
      organizationName,
    }),
  );
}

function renderRouter({
  authenticated = true,
  initialEntry = "/",
  admin = true,
}: {
  authenticated?: boolean;
  initialEntry?: string;
  admin?: boolean;
} = {}) {
  localStorage.clear();

  if (authenticated) {
    seedSession({ admin });
  }

  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  render(
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>,
  );

  return router;
}

const mockDashboardMetrics = {
  kpis: {
    openTickets: 24,
    unassignedTickets: 8,
    oldestWaitingTicket: null,
    closedToday: 12,
    avgResolutionTimeHours: 4.5,
    newToday: 15,
  },
  queue: [],
  refreshedAt: "2026-04-07T10:30:00Z",
};

describe("app routes", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/api/dashboard/metrics")) {
        return new Response(JSON.stringify(mockDashboardMetrics), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the dashboard as the authenticated index route", async () => {
    renderRouter({ initialEntry: "/" });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /painel/i }),
      ).toBeInTheDocument();
    });
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    const router = renderRouter({ authenticated: false, initialEntry: "/" });

    await waitFor(() => expect(router.state.location.pathname).toBe("/signin"));
    expect(screen.getByRole("heading", { name: /bem-vindo de volta/i })).toBeInTheDocument();
  });

  it("lets admin users open the reserved user management route", async () => {
    const router = renderRouter({ initialEntry: "/" });

    fireEvent.click(screen.getByRole("link", { name: /gestão de usuários/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/settings/users"));
    expect(screen.getByRole("heading", { name: /usuários/i })).toBeInTheDocument();
  });

  it("lets admin users open the reserved organization settings route", async () => {
    const router = renderRouter({ initialEntry: "/" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /painel/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /organização/i }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/settings/organization"),
    );
    expect(
      screen.getByRole("heading", { name: /configurações da organização/i }),
    ).toBeInTheDocument();
  });

  it("redirects to signin after sign out is clicked", async () => {
    const router = renderRouter({ initialEntry: "/" });

    fireEvent.click(screen.getAllByRole("button", { name: /sair/i })[0]);

    await waitFor(() => expect(router.state.location.pathname).toBe("/signin"));
    expect(screen.getByRole("heading", { name: /bem-vindo de volta/i })).toBeInTheDocument();
  });
});
