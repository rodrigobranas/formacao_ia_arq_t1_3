import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import TicketsPage from "./TicketsPage";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const orgResponse = { id: 1, name: "Acme Corp", slug: "acme-corp" };

function mockFetchForTickets(ticketsBody: unknown, status = 200) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/api/organizations/current")) {
      return createJsonResponse(orgResponse);
    }
    const payload =
      Array.isArray(ticketsBody)
        ? { data: ticketsBody, total: ticketsBody.length }
        : ticketsBody;
    return createJsonResponse(payload, status);
  });
}

function renderPage(initialEntry = "/tickets") {
  const router = createMemoryRouter(
    [
      { path: "/tickets", element: <TicketsPage /> },
      { path: "/tickets/:id", element: <h1>Ticket Detail</h1> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(<RouterProvider router={router} />);
  return { router };
}

const sampleTickets = [
  {
    id: 1,
    code: "TK-ABC12345",
    status: "new" as const,
    name: "John Doe",
    ticketTypeName: "Bug",
    sentiment: null,
    assignedToName: null,
    createdAt: "2026-04-07T10:00:00.000Z",
  },
  {
    id: 2,
    code: "TK-DEF67890",
    status: "assigned" as const,
    name: "Jane Smith",
    ticketTypeName: "Feature",
    sentiment: "neutral",
    assignedToName: "Operator Bob",
    createdAt: "2026-04-06T08:00:00.000Z",
  },
  {
    id: 3,
    code: "TK-GHI11111",
    status: "closed" as const,
    name: "Alice Brown",
    ticketTypeName: null,
    sentiment: null,
    assignedToName: "Operator Bob",
    createdAt: "2026-04-05T12:00:00.000Z",
  },
];

describe("TicketsPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("displays loading state while fetching", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Carregando chamados...")).toBeInTheDocument();
  });

  it("renders table with ticket data from API", async () => {
    mockFetchForTickets(sampleTickets);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("TK-ABC12345")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("TK-DEF67890")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders ticket code, name, type, status, assignee, date columns", async () => {
    mockFetchForTickets(sampleTickets);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Código")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Sentimento")).toBeInTheDocument();
    expect(screen.getByText("Ações")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Responsável")).toBeInTheDocument();
    expect(screen.getByText("Criado")).toBeInTheDocument();

    expect(screen.getByText("TK-ABC12345")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    const statusBadges = screen.getAllByText("New");
    expect(statusBadges.length).toBeGreaterThanOrEqual(1);
    const assigneeElements = screen.getAllByText("Operator Bob");
    expect(assigneeElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays empty state when no tickets exist", async () => {
    mockFetchForTickets([]);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Nenhum chamado encontrado")).toBeInTheDocument();
  });

  it("fetches tickets with status=new when the URL includes it", async () => {
    mockFetchForTickets([sampleTickets[0]]);
    renderPage("/tickets?status=new");

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.includes("status=new"))).toBe(true);
    });
  });

  it("highlights tickets with status 'new'", async () => {
    mockFetchForTickets(sampleTickets);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    const rows = screen.getAllByTestId("ticket-row");
    expect(rows[0].className).toContain("bg-primary/5");
    expect(rows[1].className).not.toContain("bg-primary/5");
  });

  it("links each row to /tickets/:id", async () => {
    mockFetchForTickets(sampleTickets);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    const link1 = screen.getByRole("link", { name: "TK-ABC12345" });
    expect(link1).toHaveAttribute("href", "/tickets/1");

    const link2 = screen.getByRole("link", { name: "TK-DEF67890" });
    expect(link2).toHaveAttribute("href", "/tickets/2");
  });

  it("handles API error gracefully", async () => {
    mockFetchForTickets({ error: "Internal Server Error" }, 500);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    expect(
      screen.getByText("Não foi possível carregar os chamados. Por favor, tente novamente."),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("fetches tickets with status query param on initial load", async () => {
    mockFetchForTickets([sampleTickets[1]]);
    renderPage("/tickets?status=assigned");

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/tickets\?.*\bstatus=assigned\b/),
      ),
    );
  });

  it("classifies ticket type and updates the row", async () => {
    mockFetchForTickets(sampleTickets);
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamados...")).not.toBeInTheDocument(),
    );

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("/api/organizations/current")) {
        return createJsonResponse(orgResponse);
      }
      if (url.includes("/classify-ticket-type") && init?.method === "POST") {
        return createJsonResponse({ ticketTypeId: 1, ticketTypeName: "Incident" });
      }
      return createJsonResponse({ data: sampleTickets, total: sampleTickets.length });
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Classificar tipo do chamado com IA" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Incident")).toBeInTheDocument();
    });
  });
});
