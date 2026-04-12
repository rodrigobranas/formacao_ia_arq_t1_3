import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import App from "./App";
import type { AuthState } from "./store/AuthContext";
import { ThemeProvider } from "./store/ThemeContext";

const mockUseAuth = vi.fn<() => AuthState>();

vi.mock("./store/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("./store/AuthContext")>(
    "./store/AuthContext",
  );

  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

function renderAppShell() {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<App />} path="/">
            <Route element={<div>Dashboard content</div>} index />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    token: "token",
    user: {
      userId: 7,
      organizationId: 3,
      admin: true,
      name: "Jane Doe",
      organizationName: "Acme Corp",
    },
    signin: vi.fn(),
    signout: vi.fn(),
    ...overrides,
  };
}

describe("App header", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("shows the organization name from auth context", () => {
    mockUseAuth.mockReturnValue(createAuthState());

    renderAppShell();

    expect(screen.getAllByText("Acme Corp")).not.toHaveLength(0);
  });

  it("shows the user name from auth context", () => {
    mockUseAuth.mockReturnValue(createAuthState());

    renderAppShell();

    expect(screen.getAllByText("Jane Doe")).not.toHaveLength(0);
  });

  it("shows the sign out button when authenticated", () => {
    mockUseAuth.mockReturnValue(createAuthState());

    renderAppShell();

    expect(
      screen.getAllByRole("button", { name: /sair/i })[0],
    ).toBeInTheDocument();
  });

  it("calls signout from auth context when the sign out button is clicked", () => {
    const signout = vi.fn();
    mockUseAuth.mockReturnValue(createAuthState({ signout }));

    renderAppShell();

    fireEvent.click(screen.getAllByRole("button", { name: /sair/i })[0]);

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it("shows admin-only navigation items for admin users", () => {
    mockUseAuth.mockReturnValue(createAuthState({ user: createAuthState().user }));

    renderAppShell();

    expect(screen.getByRole("link", { name: /painel/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tipos de chamado/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gestão de usuários/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /organização/i }),
    ).toBeInTheDocument();
  });

  it("hides admin-only navigation items for regular users", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: {
          userId: 7,
          organizationId: 3,
          admin: false,
          name: "Jane Doe",
          organizationName: "Acme Corp",
        },
      }),
    );

    renderAppShell();

    expect(screen.getByRole("link", { name: /painel/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tipos de chamado/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /gestão de usuários/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^organização$/i }),
    ).not.toBeInTheDocument();
  });

  it("falls back gracefully when the auth user profile is temporarily unavailable", () => {
    mockUseAuth.mockReturnValue(
      createAuthState({
        user: null,
      }),
    );

    renderAppShell();

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /painel/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /gestão de usuários/i })).not.toBeInTheDocument();
  });
});
