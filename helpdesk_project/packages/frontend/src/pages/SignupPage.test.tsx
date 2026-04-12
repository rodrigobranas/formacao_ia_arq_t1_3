import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import SignupPage from "./SignupPage";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function renderSignupPage(initialEntry = "/signup") {
  const router = createMemoryRouter(
    [
      { path: "/signup", element: <SignupPage /> },
      { path: "/signin", element: <h1>Sign In</h1> },
    ],
    { initialEntries: [initialEntry] },
  );

  render(<RouterProvider router={router} />);

  return { router };
}

describe("SignupPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all signup form fields", () => {
    renderSignupPage();

    expect(screen.getByLabelText(/nome da organização/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nome do administrador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
  });

  it("shows validation errors when required fields are empty", async () => {
    renderSignupPage();

    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    expect(await screen.findByText("Nome da organização é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("E-mail é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Confirmação de senha é obrigatória")).toBeInTheDocument();
  });

  it("shows an error when passwords do not match", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText(/nome da organização/i), {
      target: { value: "Acme Support" },
    });
    fireEvent.change(screen.getByLabelText(/nome do administrador/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "password456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    expect(await screen.findByText("As senhas não coincidem")).toBeInTheDocument();
  });

  it("shows an error when the password is shorter than 8 characters", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText(/nome da organização/i), {
      target: { value: "Acme Support" },
    });
    fireEvent.change(screen.getByLabelText(/nome do administrador/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    expect(
      await screen.findByText("A senha deve ter pelo menos 8 caracteres"),
    ).toBeInTheDocument();
  });

  it("calls POST /api/signup with the normalized payload on valid submission", async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ organization: { id: 1 } }));
    renderSignupPage();

    fireEvent.change(screen.getByLabelText(/nome da organização/i), {
      target: { value: "  Acme Support  " },
    });
    fireEvent.change(screen.getByLabelText(/nome do administrador/i), {
      target: { value: "  Jane Doe " },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "  JANE@ACME.COM " },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationName: "Acme Support",
            name: "Jane Doe",
            email: "jane@acme.com",
            password: "password123",
          }),
        }),
      ),
    );
  });

  it("displays server-side validation errors inline", async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({ error: "Email is already in use" }, 422),
    );
    renderSignupPage();

    fireEvent.change(screen.getByLabelText(/nome da organização/i), {
      target: { value: "Acme Support" },
    });
    fireEvent.change(screen.getByLabelText(/nome do administrador/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    expect(await screen.findByText("Email is already in use")).toBeInTheDocument();
  });

  it("navigates to /signin on successful signup", async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ organization: { id: 1 } }));
    const { router } = renderSignupPage();

    fireEvent.change(screen.getByLabelText(/nome da organização/i), {
      target: { value: "Acme Support" },
    });
    fireEvent.change(screen.getByLabelText(/nome do administrador/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@acme.com" },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar organização/i }));

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/signin");
  });

  it("includes a link to /signin", () => {
    renderSignupPage();

    expect(screen.getByRole("link", { name: /entrar/i })).toHaveAttribute(
      "href",
      "/signin",
    );
  });
});
