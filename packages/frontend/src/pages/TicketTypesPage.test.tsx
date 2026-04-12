import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AuthState } from "@/store/AuthContext";
import TicketTypesPage from "./TicketTypesPage";

const mockSignout = vi.fn();
const mockUseAuth = vi.fn<() => AuthState>();

vi.mock("@/store/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/store/AuthContext")>(
    "@/store/AuthContext",
  );

  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

type MockResponseInit = {
  ok?: boolean;
  status?: number;
  body?: unknown;
};

const fetchMock = vi.fn();

function createJsonResponse({
  ok = true,
  status = 200,
  body,
}: MockResponseInit = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function createTextResponse({
  ok = true,
  status = 204,
}: MockResponseInit = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockRejectedValue(new Error("No JSON body")),
  };
}

const initialTicketTypes = [
  {
    id: 1,
    name: "Customização",
    description: "Solicitações de personalização e ajustes",
  },
  {
    id: 2,
    name: "Dúvida",
    description: "Chamados relacionados a dúvidas e esclarecimentos",
  },
];

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    token: "test-token",
    user: {
      userId: 1,
      organizationId: 1,
      admin: true,
      name: "Admin User",
      organizationName: "Test Org",
    },
    signin: vi.fn(),
    signout: mockSignout,
    ...overrides,
  };
}

function renderPage() {
  render(<TicketTypesPage />);
}

async function waitForInitialLoad() {
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith("/api/ticket-types"),
  );
}

describe("TicketTypesPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockSignout.mockReset();
    fetchMock.mockResolvedValue(createJsonResponse({ body: initialTicketTypes }));
    vi.stubGlobal("fetch", fetchMock);
    mockUseAuth.mockReturnValue(createAuthState());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the table with ticket types fetched from the API", async () => {
    renderPage();
    await waitForInitialLoad();

    expect(await screen.findByText("Customização")).toBeInTheDocument();
    expect(screen.getByText("Dúvida")).toBeInTheDocument();
  });

  it("displays the Name and Description columns", async () => {
    renderPage();
    await waitForInitialLoad();

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Descrição" }),
    ).toBeInTheDocument();
  });

  it("shows an inline editable row when clicking + New", async () => {
    renderPage();
    await waitForInitialLoad();
    fireEvent.click(await screen.findByRole("button", { name: /novo tipo/i }));

    expect(screen.getByPlaceholderText("Nome do tipo de chamado")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Descrição opcional")).toBeInTheDocument();
  });

  it("saves a new ticket type and adds it to the table", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialTicketTypes }))
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 201,
          body: {
            id: 3,
            name: "Financeiro",
            description: "Fluxos e regras financeiras",
          },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo tipo/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome do tipo de chamado"), {
      target: { value: "Financeiro" },
    });
    fireEvent.change(screen.getByPlaceholderText("Descrição opcional"), {
      target: { value: "Fluxos e regras financeiras" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/ticket-types",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Financeiro",
            description: "Fluxos e regras financeiras",
          }),
        }),
      ),
    );

    expect(await screen.findByText("Financeiro")).toBeInTheDocument();
  });

  it("shows an inline validation error when the new name is empty", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo tipo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  });

  it("shows an inline validation error when the new name exceeds 50 characters", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo tipo/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome do tipo de chamado"), {
      target: { value: "A".repeat(51) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("O nome deve ter no máximo 50 caracteres"),
    ).toBeInTheDocument();
  });

  it("removes the inline row when creation is canceled", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo tipo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByPlaceholderText("Nome do tipo de chamado")).not.toBeInTheDocument();
  });

  it("transforms a row into editable inputs with current values when clicking Edit", async () => {
    renderPage();
    await waitForInitialLoad();

    const rows = await screen.findAllByRole("row");
    const customizacaoRow = rows.find((row) =>
      within(row).queryByText("Customização"),
    );

    expect(customizacaoRow).toBeDefined();
    fireEvent.click(within(customizacaoRow!).getByRole("button", { name: "Editar" }));

    expect(screen.getByDisplayValue("Customização")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Solicitações de personalização e ajustes"),
    ).toBeInTheDocument();
  });

  it("saves an edit with valid data and updates the row", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialTicketTypes }))
      .mockResolvedValueOnce(
        createJsonResponse({
          body: {
            id: 1,
            name: "Customização Plus",
            description: "Ajustes avançados",
          },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    const row = (await screen.findAllByRole("row")).find((tableRow) =>
      within(tableRow).queryByText("Customização"),
    );

    fireEvent.click(within(row!).getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByDisplayValue("Customização"), {
      target: { value: "Customização Plus" },
    });
    fireEvent.change(
      screen.getByDisplayValue("Solicitações de personalização e ajustes"),
      {
        target: { value: "Ajustes avançados" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/ticket-types/1",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            name: "Customização Plus",
            description: "Ajustes avançados",
          }),
        }),
      ),
    );

    expect(await screen.findByText("Customização Plus")).toBeInTheDocument();
  });

  it("restores the original values when edit is canceled", async () => {
    renderPage();
    await waitForInitialLoad();

    const row = (await screen.findAllByRole("row")).find((tableRow) =>
      within(tableRow).queryByText("Customização"),
    );

    fireEvent.click(within(row!).getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByDisplayValue("Customização"), {
      target: { value: "Mudado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByText("Customização")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Mudado")).not.toBeInTheDocument();
  });

  it("shows a confirmation dialog when clicking Delete", async () => {
    renderPage();
    await waitForInitialLoad();

    const row = (await screen.findAllByRole("row")).find((tableRow) =>
      within(tableRow).queryByText("Customização"),
    );

    fireEvent.click(within(row!).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/excluir tipo de chamado/i)).toBeInTheDocument();
  });

  it("deletes a ticket type after confirmation and removes the row", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialTicketTypes }))
      .mockResolvedValueOnce(createTextResponse());

    renderPage();
    await waitForInitialLoad();

    const row = (await screen.findAllByRole("row")).find((tableRow) =>
      within(tableRow).queryByText("Customização"),
    );

    fireEvent.click(within(row!).getByRole("button", { name: "Excluir" }));
    fireEvent.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/ticket-types/1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );

    await waitFor(() =>
      expect(screen.queryByText("Customização")).not.toBeInTheDocument(),
    );
  });

  it("shows an in-use error message when delete is blocked with 409", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialTicketTypes }))
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 409,
          body: {
            error: "Cannot delete ticket type that is in use by existing tickets",
          },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    const row = (await screen.findAllByRole("row")).find((tableRow) =>
      within(tableRow).queryByText("Customização"),
    );

    fireEvent.click(within(row!).getByRole("button", { name: "Excluir" }));
    fireEvent.click(await screen.findByRole("button", { name: /^excluir$/i }));

    expect(
      await screen.findByText(
        "Cannot delete ticket type that is in use by existing tickets",
      ),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no ticket types", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ body: [] }));

    renderPage();

    expect(
      await screen.findByText("Nenhum tipo de chamado ainda"),
    ).toBeInTheDocument();
  });

  it("displays an error message when the initial fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Unable to load ticket types"));

    renderPage();

    expect(
      await screen.findByText("Unable to load ticket types"),
    ).toBeInTheDocument();
  });

  describe("admin user", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState({ user: { userId: 1, organizationId: 1, admin: true, name: "Admin", organizationName: "Org" } }));
    });

    it("shows the New Type button", async () => {
      renderPage();
      await waitForInitialLoad();

      expect(screen.getByRole("button", { name: /novo tipo/i })).toBeInTheDocument();
    });

    it("shows Edit and Delete buttons for each ticket type", async () => {
      renderPage();
      await waitForInitialLoad();

      const editButtons = await screen.findAllByRole("button", { name: "Editar" });
      const deleteButtons = screen.getAllByRole("button", { name: "Excluir" });

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it("shows the Actions column header", async () => {
      renderPage();
      await waitForInitialLoad();

      expect(screen.getByRole("columnheader", { name: "Ações" })).toBeInTheDocument();
    });
  });

  describe("regular user (non-admin)", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState({ user: { userId: 2, organizationId: 1, admin: false, name: "Regular", organizationName: "Org" } }));
    });

    it("does not show the New Type button", async () => {
      renderPage();
      await waitForInitialLoad();

      expect(screen.queryByRole("button", { name: /novo tipo/i })).not.toBeInTheDocument();
    });

    it("does not show Edit or Delete buttons", async () => {
      renderPage();
      await waitForInitialLoad();

      await screen.findByText("Customização");

      expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    });

    it("does not show the Actions column header", async () => {
      renderPage();
      await waitForInitialLoad();

      await screen.findByText("Customização");

      expect(screen.queryByRole("columnheader", { name: "Ações" })).not.toBeInTheDocument();
    });

    it("displays ticket types in read-only mode", async () => {
      renderPage();
      await waitForInitialLoad();

      expect(await screen.findByText("Customização")).toBeInTheDocument();
      expect(screen.getByText("Dúvida")).toBeInTheDocument();
      expect(screen.getByText("Solicitações de personalização e ajustes")).toBeInTheDocument();
    });
  });
});
