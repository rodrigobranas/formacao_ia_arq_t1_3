import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import PublicTicketPage from "./PublicTicketPage";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/:orgSlug/tickets/new", element: <PublicTicketPage /> },
      { path: "/:orgSlug/tickets/track", element: <h1>Track Page</h1> },
    ],
    { initialEntries: ["/acme/tickets/new"] },
  );
  render(<RouterProvider router={router} />);
  return { router };
}

describe("PublicTicketPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(async (input) => {
      if (typeof input === "string" && input.includes("/ticket-types")) {
        return createJsonResponse([]);
      }
      return createJsonResponse({}, 500);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders form with all required fields", () => {
    renderPage();
    expect(screen.getByLabelText(/^nome$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^telefone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^descrição$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^anexos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar chamado/i })).toBeInTheDocument();
  });

  it("shows validation errors for empty required fields on submit", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /enviar chamado/i }));
    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("E-mail é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Telefone é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
  });

  it("shows file size error when attachment exceeds 1MB", async () => {
    renderPage();
    const file = new File(["x".repeat(1_048_577)], "large.png", {
      type: "image/png",
    });
    const input = screen.getByLabelText(/^anexos/i);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText(/large\.png.*excede o limite de 1MB/),
    ).toBeInTheDocument();
  });

  it("calls POST endpoint with correct payload on valid submit", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (typeof input === "string" && input.includes("/ticket-types")) {
        return createJsonResponse([]);
      }
      return createJsonResponse({ code: "TK-ABC12345", message: "Ticket created successfully" }, 201);
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/^nome$/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), {
      target: { value: "+5511999999999" },
    });
    fireEvent.change(screen.getByLabelText(/^descrição$/i), {
      target: { value: "I need help with my account" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar chamado/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (call) =>
          typeof call[0] === "string" && call[0].includes("/tickets") && !call[0].includes("/ticket-types"),
      );
      expect(postCall).toBeDefined();
      expect(postCall![1]).toEqual(
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      const body = JSON.parse(postCall![1]!.body as string);
      expect(body).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "+5511999999999",
        description: "I need help with my account",
      });
    });
  });

  it("displays ticket code on successful submission", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (typeof input === "string" && input.includes("/ticket-types")) {
        return createJsonResponse([]);
      }
      return createJsonResponse({ code: "TK-XYZ98765", message: "Ticket created successfully" }, 201);
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/^nome$/i), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/^descrição$/i), {
      target: { value: "Help needed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar chamado/i }));

    expect(await screen.findByTestId("ticket-code")).toHaveTextContent("TK-XYZ98765");
    expect(screen.getByText(/seu chamado foi enviado/i)).toBeInTheDocument();
  });

  it("displays API error message on failure", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (typeof input === "string" && input.includes("/ticket-types")) {
        return createJsonResponse([]);
      }
      return createJsonResponse({ error: "Organization not found" }, 404);
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/^nome$/i), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByLabelText(/^e-mail$/i), {
      target: { value: "jane@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/^telefone$/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/^descrição$/i), {
      target: { value: "Help needed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar chamado/i }));

    expect(await screen.findByText("Organization not found")).toBeInTheDocument();
  });
});
