import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import TicketDetailPage from "./TicketDetailPage";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderPage(ticketId = "1") {
  const router = createMemoryRouter(
    [
      { path: "/tickets/:id", element: <TicketDetailPage /> },
      { path: "/tickets", element: <h1>Ticket List</h1> },
    ],
    { initialEntries: [`/tickets/${ticketId}`] },
  );
  render(<RouterProvider router={router} />);
  return { router };
}

const sampleTicket = {
  id: 1,
  code: "TK-ABC12345",
  status: "new",
  name: "John Doe",
  email: "john@example.com",
  phone: "+5511999999999",
  description: "I need help with my account.",
  ticketTypeName: "Bug",
  sentiment: null,
  assignedToName: null,
  createdAt: "2026-04-07T10:00:00.000Z",
  updatedAt: "2026-04-07T10:00:00.000Z",
  comments: [],
  attachments: [],
  assignments: [],
};

const assignedTicket = {
  ...sampleTicket,
  status: "assigned",
  assignedToName: "Operator Jane",
  assignments: [
    {
      assignedToName: "Operator Jane",
      assignedByName: "Operator Jane",
      createdAt: "2026-04-07T12:00:00.000Z",
    },
  ],
};

const ticketWithComments = {
  ...assignedTicket,
  comments: [
    {
      id: 1,
      userName: "Operator Jane",
      content: "Looking into this now.",
      attachments: [],
      createdAt: "2026-04-07T12:30:00.000Z",
    },
    {
      id: 2,
      userName: "Operator Bob",
      content: "Fixed the issue.",
      attachments: [
        {
          id: 10,
          filename: "fix.pdf",
          contentType: "application/pdf",
          content: "dGVzdA==",
          createdAt: "2026-04-07T13:00:00.000Z",
        },
      ],
      createdAt: "2026-04-07T13:00:00.000Z",
    },
  ],
};

const ticketWithAttachments = {
  ...sampleTicket,
  attachments: [
    {
      id: 5,
      filename: "screenshot.png",
      contentType: "image/png",
      content: "dGVzdA==",
      createdAt: "2026-04-07T10:00:00.000Z",
    },
  ],
};

const closedTicket = {
  ...sampleTicket,
  status: "closed",
  assignedToName: "Operator Jane",
};

describe("TicketDetailPage", () => {
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
    expect(screen.getByText("Carregando chamado...")).toBeInTheDocument();
  });

  it("renders ticket metadata (code, status, name, email, phone, description)", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(sampleTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("heading", { name: "TK-ABC12345" })).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("+5511999999999")).toBeInTheDocument();
    expect(screen.getByText("I need help with my account.")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("displays error state for non-existent ticket (404)", async () => {
    fetchMock.mockResolvedValue(createJsonResponse({ error: "Not found" }, 404));
    renderPage("999");

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Chamado não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Voltar para chamados")).toBeInTheDocument();
  });

  it("shows 'Assign to me' button when status is 'new'", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(sampleTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: "Atribuir a mim" })).toBeInTheDocument();
  });

  it("hides 'Assign to me' button when status is not 'new'", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: "Atribuir a mim" })).not.toBeInTheDocument();
  });

  it("calls assign endpoint on 'Assign to me' click", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(sampleTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: "ok" }));
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Atribuir a mim" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/tickets/1/assign", { method: "POST" }),
    );
  });

  it("shows 'Forward' and 'Close' buttons when status is 'assigned'", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: "Encaminhar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
  });

  it("calls forward endpoint with selected userId", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    const usersResponse = [
      { id: 2, name: "Operator Bob", email: "bob@example.com", admin: false },
      { id: 3, name: "Operator Carol", email: "carol@example.com", admin: false },
    ];
    fetchMock.mockResolvedValueOnce(createJsonResponse(usersResponse));

    fireEvent.click(screen.getByRole("button", { name: "Encaminhar" }));

    await waitFor(() =>
      expect(screen.getByText("Operator Bob")).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Encaminhar para:"), { target: { value: "2" } });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: "ok" }));
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/tickets/1/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 2 }),
      }),
    );
  });

  it("calls close endpoint on 'Close' click", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: "ok" }));
    fetchMock.mockResolvedValueOnce(createJsonResponse(closedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/tickets/1/close", { method: "POST" }),
    );
  });

  it("renders comments in chronological order", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(ticketWithComments));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Looking into this now.")).toBeInTheDocument();
    expect(screen.getByText("Fixed the issue.")).toBeInTheDocument();

    const firstComment = screen.getByText("Looking into this now.");
    const secondComment = screen.getByText("Fixed the issue.");
    expect(
      firstComment.compareDocumentPosition(secondComment) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders assignment history entries", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText(/atribuiu a/)).toBeInTheDocument();
  });

  it("renders file attachments as downloadable links", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(ticketWithAttachments));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    const link = screen.getByText("screenshot.png");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("download", "screenshot.png");
  });

  it("renders comment-level attachments as downloadable links", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(ticketWithComments));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    const link = screen.getByText("fix.pdf");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("download", "fix.pdf");
  });

  it("submits new comment via comment form", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Escreva um comentário..."), {
      target: { value: "This is a test comment." },
    });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 1 }, 201));
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/tickets/1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "This is a test comment." }),
      }),
    );
  });

  it("submits comment with file attachment", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Escreva um comentário..."), {
      target: { value: "Comment with attachment." },
    });

    const file = new File(["test content"], "doc.txt", { type: "text/plain" });
    const fileInput = screen.getByDisplayValue("") as HTMLInputElement;
    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[0] as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: 2 }, 201));
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/tickets/1/comments",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("validates attachment size before submission", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Escreva um comentário..."), {
      target: { value: "Comment with large file." },
    });

    const largeContent = new Uint8Array(1_048_577);
    const file = new File([largeContent], "large.bin", { type: "application/octet-stream" });
    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[0] as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(screen.getByText("O anexo deve ter menos de 1MB.")).toBeInTheDocument(),
    );
  });

  it("shows error when submitting empty comment", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(screen.getByText("O comentário não pode estar vazio.")).toBeInTheDocument(),
    );
  });

  it("refreshes data after successful assign action", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(sampleTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: "ok" }));
    fetchMock.mockResolvedValueOnce(createJsonResponse(assignedTicket));

    fireEvent.click(screen.getByRole("button", { name: "Atribuir a mim" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledTimes(3),
    );

    const lastCall = fetchMock.mock.calls[2];
    expect(lastCall[0]).toBe("/api/tickets/1");
  });

  it("shows 'Unassigned' when ticket has no assignee", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(sampleTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("Não atribuído")).toBeInTheDocument();
  });

  it("does not show action buttons when status is 'closed'", async () => {
    fetchMock.mockResolvedValue(createJsonResponse(closedTicket));
    renderPage();

    await waitFor(() =>
      expect(screen.queryByText("Carregando chamado...")).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole("button", { name: "Atribuir a mim" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Encaminhar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fechar" })).not.toBeInTheDocument();
  });
});
