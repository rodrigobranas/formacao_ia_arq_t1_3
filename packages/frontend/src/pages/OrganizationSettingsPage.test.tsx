import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import OrganizationSettingsPage from "./OrganizationSettingsPage";
import { AuthProvider } from "@/store/AuthContext";

const AUTH_TOKEN_STORAGE_KEY = "auth.token";
const AUTH_USER_STORAGE_KEY = "auth.user";

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

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createToken(
  overrides: Partial<{
    userId: number;
    organizationId: number;
    admin: boolean;
  }> = {},
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

function seedSession() {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken());
  localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify({
      name: "Jane Admin",
      organizationName: "Acme Corp",
    }),
  );
}

const organizationResponse = { id: 13, name: "Acme Corp" };

function renderPage() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <OrganizationSettingsPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

async function waitForInitialLoad() {
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(expect.any(Object)),
  );
}

describe("OrganizationSettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      createJsonResponse({ body: organizationResponse }),
    );
    vi.stubGlobal("fetch", fetchMock);
    seedSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches and displays the current organization name", async () => {
    renderPage();
    await waitForInitialLoad();

    expect(
      await screen.findByTestId("organization-name-display"),
    ).toHaveTextContent("Acme Corp");
  });

  it("shows loading state while fetching", () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(screen.getByText("Carregando organização...")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    renderPage();

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("shows error from server response", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        ok: false,
        status: 500,
        body: { error: "Internal server error" },
      }),
    );

    renderPage();

    expect(
      await screen.findByText("Internal server error"),
    ).toBeInTheDocument();
  });

  it("pre-fills edit form with the current organization name", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    const input = screen.getByLabelText("Nome da Organização") as HTMLInputElement;
    expect(input.value).toBe("Acme Corp");
  });

  it("shows validation error when name is empty", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  });

  it("shows validation error when name is only whitespace", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  });

  it("does not make API call when name is empty", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await screen.findByText("Nome é obrigatório");

    const postCalls = fetchMock.mock.calls.filter((call: unknown[]) => {
      const request = call[0] as Request;
      return request instanceof Request && request.method === "POST";
    });
    expect(postCalls).toHaveLength(0);
  });

  it("calls POST /api/organizations/current/change-name on save", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ body: organizationResponse }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({ body: { id: 13, name: "New Corp" } }),
      );

    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "New Corp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find((call: unknown[]) => {
        const request = call[0] as Request;
        return request instanceof Request && request.method === "POST";
      });
      expect(postCall).toBeDefined();
    });
  });

  it("displays success feedback after saving", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ body: organizationResponse }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({ body: { id: 13, name: "New Corp" } }),
      );

    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "New Corp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Nome da organização atualizado com sucesso."),
    ).toBeInTheDocument();
  });

  it("updates the displayed name after saving", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ body: organizationResponse }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({ body: { id: 13, name: "New Corp" } }),
      );

    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "New Corp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(screen.getByTestId("organization-name-display")).toHaveTextContent(
        "New Corp",
      ),
    );
  });

  it("displays server error on failure", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ body: organizationResponse }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 422,
          body: { error: "Name cannot be empty" },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "X" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("Name cannot be empty"),
    ).toBeInTheDocument();
  });

  it("cancels editing and restores the original name display", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByLabelText("Nome da Organização")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByTestId("organization-name-display")).toHaveTextContent(
      "Acme Corp",
    );
  });

  it("full edit flow: change name, save, updated name displayed", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({ body: organizationResponse }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({ body: { id: 13, name: "Updated Corp" } }),
      );

    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    expect(screen.getByTestId("organization-name-display")).toHaveTextContent(
      "Acme Corp",
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "Updated Corp" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(screen.getByTestId("organization-name-display")).toHaveTextContent(
        "Updated Corp",
      ),
    );
    expect(
      screen.getByText("Nome da organização atualizado com sucesso."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome da Organização")).not.toBeInTheDocument();
  });

  it("error flow: empty name shows validation error, no API call made", async () => {
    renderPage();
    await waitForInitialLoad();

    await screen.findByTestId("organization-name-display");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome da Organização"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();

    const postCalls = fetchMock.mock.calls.filter((call: unknown[]) => {
      const request = call[0] as Request;
      return request instanceof Request && request.method === "POST";
    });
    expect(postCalls).toHaveLength(0);

    expect(screen.getByLabelText("Nome da Organização")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled();
  });
});
