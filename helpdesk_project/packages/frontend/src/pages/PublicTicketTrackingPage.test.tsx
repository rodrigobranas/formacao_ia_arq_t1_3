import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import PublicTicketTrackingPage from "./PublicTicketTrackingPage";

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
      { path: "/:orgSlug/tickets/track", element: <PublicTicketTrackingPage /> },
      { path: "/:orgSlug/tickets/new", element: <h1>New Ticket</h1> },
    ],
    { initialEntries: ["/acme/tickets/track"] },
  );
  render(<RouterProvider router={router} />);
  return { router };
}

describe("PublicTicketTrackingPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders code input field", () => {
    renderPage();
    expect(screen.getByLabelText(/código do chamado/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buscar/i })).toBeInTheDocument();
  });

  it("shows error for empty code submission", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));
    expect(
      await screen.findByText("Por favor, digite o código do chamado"),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls GET endpoint with entered code", async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        code: "TK-ABC12345",
        status: "new",
        createdAt: "2026-04-07T10:00:00.000Z",
        updatedAt: "2026-04-07T10:00:00.000Z",
      }),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/código do chamado/i), {
      target: { value: "TK-ABC12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/public/acme/tickets/TK-ABC12345",
      ),
    );
  });

  it("displays ticket status on success", async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        code: "TK-ABC12345",
        status: "assigned",
        createdAt: "2026-04-07T10:00:00.000Z",
        updatedAt: "2026-04-07T12:00:00.000Z",
      }),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/código do chamado/i), {
      target: { value: "TK-ABC12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    const statusSection = await screen.findByTestId("ticket-status");
    expect(statusSection).toBeInTheDocument();
    expect(screen.getByText("Chamado TK-ABC12345")).toBeInTheDocument();
    expect(screen.getByText("Atribuído")).toBeInTheDocument();
  });

  it("displays error for invalid code (404)", async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({ error: "Not found" }, 404),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/código do chamado/i), {
      target: { value: "TK-INVALID1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /buscar/i }));

    expect(
      await screen.findByText(
        "Chamado não encontrado. Verifique o código e tente novamente.",
      ),
    ).toBeInTheDocument();
  });

  it("includes a link to submit a new ticket", () => {
    renderPage();
    expect(
      screen.getByRole("link", { name: /enviar um chamado/i }),
    ).toHaveAttribute("href", "/acme/tickets/new");
  });
});
