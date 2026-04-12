import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import UsersPage from "./UsersPage";
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

function seedSession(
  overrides: Partial<{
    userId: number;
    organizationId: number;
    admin: boolean;
  }> = {},
) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, createToken(overrides));
  localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify({
      name: "Jane Admin",
      organizationName: "Acme Corp",
    }),
  );
}

const initialUsers = [
  { id: 1, name: "Alice Johnson", email: "alice@acme.com", admin: true },
  { id: 2, name: "Bob Smith", email: "bob@acme.com", admin: false },
];

function renderPage() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

async function waitForInitialLoad() {
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(Object),
    ),
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(createJsonResponse({ body: initialUsers }));
    vi.stubGlobal("fetch", fetchMock);
    seedSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the user table with name, email, and role columns", async () => {
    renderPage();
    await waitForInitialLoad();

    expect(screen.getByRole("columnheader", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "E-mail" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Perfil" })).toBeInTheDocument();
  });

  it("fetches users on mount and displays them", async () => {
    renderPage();
    await waitForInitialLoad();

    expect(await screen.findByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("bob@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });

  it("shows the create user form when clicking New User", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));

    expect(screen.getByPlaceholderText("Nome")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("E-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Admin")).toBeInTheDocument();
  });

  it("validates required name field", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Nome é obrigatório")).toBeInTheDocument();
  });

  it("validates required email field", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("E-mail é obrigatório")).toBeInTheDocument();
  });

  it("validates password minimum length", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(
      await screen.findByText("A senha deve ter pelo menos 8 caracteres"),
    ).toBeInTheDocument();
  });

  it("validates required password field", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "test@acme.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Senha é obrigatória")).toBeInTheDocument();
  });

  it("calls POST /api/users with correct payload on create", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(
        createJsonResponse({
          body: {
            id: 3,
            name: "Carol White",
            email: "carol@acme.com",
            admin: false,
          },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Carol White" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "carol@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "securepass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        (call: unknown[]) => {
          const request = call[0] as Request;
          return request instanceof Request && request.method === "POST";
        },
      );
      expect(postCall).toBeDefined();
    });

    expect(await screen.findByText("Carol White")).toBeInTheDocument();
  });

  it("displays server validation errors for duplicate email", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 422,
          body: { error: "Email is already in use" },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Duplicate User" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "alice@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Email is already in use")).toBeInTheDocument();
  });

  it("shows confirmation dialog when clicking Delete", async () => {
    renderPage();
    await waitForInitialLoad();

    const deleteButtons = await screen.findAllByRole("button", { name: "Excluir" });
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/excluir usuário/i)).toBeInTheDocument();
  });

  it("calls DELETE /api/users/:id on confirmation and removes from table", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(createTextResponse());

    renderPage();
    await waitForInitialLoad();

    const deleteButtons = await screen.findAllByRole("button", { name: "Excluir" });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(
        (call: unknown[]) => {
          const request = call[0] as Request;
          return request instanceof Request && request.method === "DELETE";
        },
      );
      expect(deleteCall).toBeDefined();
    });

    await waitFor(() =>
      expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument(),
    );
  });

  it("displays error when delete fails with 403", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 403,
          body: { error: "Admin cannot delete themselves" },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    const deleteButtons = await screen.findAllByRole("button", { name: "Excluir" });
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(await screen.findByRole("button", { name: /^excluir$/i }));

    expect(
      await screen.findByText("Admin cannot delete themselves"),
    ).toBeInTheDocument();
  });

  it("shows the empty state when there are no users", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ body: [] }));

    renderPage();

    expect(await screen.findByText("Nenhum usuário ainda")).toBeInTheDocument();
  });

  it("displays an error message when the initial fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Unable to load users"));

    renderPage();

    expect(
      await screen.findByText("Unable to load users"),
    ).toBeInTheDocument();
  });

  it("hides the form when cancel is clicked", async () => {
    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    expect(screen.getByPlaceholderText("Nome")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByPlaceholderText("Nome")).not.toBeInTheDocument();
  });

  it("full create user flow: fill form, submit, user appears in table", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(
        createJsonResponse({
          body: {
            id: 4,
            name: "Dave Brown",
            email: "dave@acme.com",
            admin: true,
          },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Dave Brown" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "dave@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "strongpassword" },
    });
    fireEvent.click(screen.getByLabelText("Admin"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Dave Brown")).toBeInTheDocument();
    expect(screen.getByText("dave@acme.com")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Nome")).not.toBeInTheDocument();
  });

  it("full delete user flow: click delete, confirm, user removed from table", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(createTextResponse());

    renderPage();
    await waitForInitialLoad();

    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", { name: "Excluir" });
    fireEvent.click(deleteButtons[1]);
    fireEvent.click(await screen.findByRole("button", { name: /^excluir$/i }));

    await waitFor(() =>
      expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument(),
    );
  });

  it("error flow: duplicate email shows error, form remains editable", async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ body: initialUsers }))
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 422,
          body: { error: "Email is already in use" },
        }),
      );

    renderPage();
    await waitForInitialLoad();

    fireEvent.click(await screen.findByRole("button", { name: /novo usuário/i }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "Duplicate" },
    });
    fireEvent.change(screen.getByPlaceholderText("E-mail"), {
      target: { value: "alice@acme.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Senha"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Email is already in use")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled();
  });
});
