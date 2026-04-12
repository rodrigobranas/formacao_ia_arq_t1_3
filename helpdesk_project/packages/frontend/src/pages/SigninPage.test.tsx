import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import type { AuthState } from "@/store/AuthContext";
import SigninPage from "./SigninPage";

const signinMock = vi.fn<(email: string, password: string) => Promise<void>>();

vi.mock("@/store/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/store/AuthContext")>(
    "@/store/AuthContext",
  );

  return {
    ...actual,
    useAuth: () =>
      ({
        token: null,
        user: null,
        signin: signinMock,
        signout: vi.fn(),
      }) satisfies AuthState,
  };
});

function renderSigninPage(initialEntry = "/signin") {
  const router = createMemoryRouter(
    [
      { path: "/signin", element: <SigninPage /> },
      { path: "/signup", element: <h1>Create a new organization</h1> },
      { path: "/", element: <h1>Dashboard</h1> },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return { router };
}

describe("SigninPage", () => {
  beforeEach(() => {
    signinMock.mockReset();
  });

  it("renders the signin form fields", () => {
    renderSigninPage();

    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
  });

  it("shows validation errors when required fields are empty", async () => {
    renderSigninPage();

    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(await screen.findByText("E-mail é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
  });

  it("shows a generic error message for invalid credentials", async () => {
    signinMock.mockRejectedValue(new Error("Credenciais inválidas"));
    renderSigninPage();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    expect(await screen.findByText("Credenciais inválidas")).toBeInTheDocument();
  });

  it("calls signin from AuthContext on submission", async () => {
    signinMock.mockResolvedValue();
    renderSigninPage();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "  JANE@ACME.COM " },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() =>
      expect(signinMock).toHaveBeenCalledWith("jane@acme.com", "password123"),
    );
  });

  it("navigates to / on successful signin", async () => {
    signinMock.mockResolvedValue();
    const { router } = renderSigninPage();

    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("includes a link to /signup", () => {
    renderSigninPage();

    expect(screen.getByRole("link", { name: /aqui/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
