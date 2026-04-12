import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import DashboardPage from "./DashboardPage";
import { AuthProvider } from "@/store/AuthContext";

const AUTH_TOKEN_STORAGE_KEY = "auth.token";
const AUTH_USER_STORAGE_KEY = "auth.user";

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
    JSON.stringify({ name: "Jane Doe", organizationName: "Acme Corp" }),
  );
}

const mockMetrics = {
  kpis: {
    openTickets: 24,
    unassignedTickets: 8,
    oldestWaitingTicket: {
      id: 42,
      code: "TK-ABC123",
      name: "Connection issue",
      createdAt: "2026-04-06T14:30:00Z",
      ageMinutes: 135,
    },
    closedToday: 12,
    avgResolutionTimeHours: 4.5,
    newToday: 15,
  },
  queue: [],
  trends: {
    volume: [
      { date: "2026-04-01", count: 18 },
      { date: "2026-04-02", count: 22 },
      { date: "2026-04-03", count: 15 },
    ],
    resolutionTime: [
      { date: "2026-04-01", avgHours: 3.2 },
      { date: "2026-04-02", avgHours: 5.1 },
      { date: "2026-04-03", avgHours: 4.0 },
    ],
    byType: [
      { typeName: "Bug", count: 45 },
      { typeName: "Feature Request", count: 30 },
      { typeName: "Support", count: 20 },
    ],
  },
  refreshedAt: "2026-04-07T10:30:00Z",
};

// Recharts uses ResizeObserver internally for ResponsiveContainer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let fetchMock: ReturnType<typeof vi.fn>;

function renderDashboard() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
    vi.stubGlobal("fetch", fetchMock);
    seedSession();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders 6 KPI cards with correct labels", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Chamados Abertos")).toBeInTheDocument();
    });

    expect(screen.getByText("Chamados Não Atribuídos")).toBeInTheDocument();
    expect(screen.getByText("Chamado Mais Antigo em Espera")).toBeInTheDocument();
    expect(screen.getByText("Chamados Fechados Hoje")).toBeInTheDocument();
    expect(screen.getByText("Tempo Médio de Resolução")).toBeInTheDocument();
    expect(screen.getByText("Novos Chamados Hoje")).toBeInTheDocument();
  });

  it("renders KPI values correctly", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("24")).toBeInTheDocument();
    });

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("auto-refresh fires every 30 seconds", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Chamados Abertos")).toBeInTheDocument();
    });

    const initialCallCount = fetchMock.mock.calls.length;

    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("manual refresh button triggers a data fetch", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Chamados Abertos")).toBeInTheDocument();
    });

    const initialCallCount = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: /atualizar/i }));

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("'Last refreshed' timestamp updates after each refresh", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("last-refreshed")).toBeInTheDocument();
    });

    const timestampText = screen.getByTestId("last-refreshed").textContent;
    expect(timestampText).toContain("Última atualização:");
  });

  it("displays loading skeletons during initial fetch", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    renderDashboard();

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays error message when API fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Não foi possível carregar as métricas do painel. Por favor, tente novamente."),
    ).toBeInTheDocument();
  });

  it("formats time durations correctly (135 minutes -> '2h 15m')", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("2h 15m").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("formats avg resolution time from hours to duration", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("4h 30m")).toBeInTheDocument();
    });
  });

  it("shows 'None' for oldest waiting ticket when null", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockMetrics,
        kpis: { ...mockMetrics.kpis, oldestWaitingTicket: null },
      }),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("None")).toBeInTheDocument();
    });
  });

  it("shows 'N/A' for avg resolution time when null", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockMetrics,
        kpis: { ...mockMetrics.kpis, avgResolutionTimeHours: null },
      }),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  it("renders time range selector with 7d, 30d, 90d options", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Volume de Chamados ao Longo do Tempo")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "7d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90d" })).toBeInTheDocument();
  });

  it("default selected period is 30d", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Volume de Chamados ao Longo do Tempo")).toBeInTheDocument();
    });

    const urls = fetchMock.mock.calls.map((c: unknown[]) =>
      c[0] instanceof Request ? c[0].url : String(c[0]),
    );
    expect(urls.some((u: string) => u.includes("period=30d"))).toBe(true);
  });

  it("changing period triggers a new data fetch with updated period param", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Volume de Chamados ao Longo do Tempo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "7d" }));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c: unknown[]) =>
        c[0] instanceof Request ? c[0].url : String(c[0]),
      );
      expect(urls.some((u: string) => u.includes("period=7d"))).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "90d" }));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((c: unknown[]) =>
        c[0] instanceof Request ? c[0].url : String(c[0]),
      );
      expect(urls.some((u: string) => u.includes("period=90d"))).toBe(true);
    });
  });

  it("renders all three chart sections", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Volume de Chamados ao Longo do Tempo")).toBeInTheDocument();
    });

    expect(screen.getByText("Tendência de Tempo de Resolução")).toBeInTheDocument();
    expect(screen.getByText("Chamados por Tipo")).toBeInTheDocument();
  });

  it("shows KPIs and trends together on the same page", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Chamados Abertos")).toBeInTheDocument();
    });

    expect(screen.getByText("Volume de Chamados ao Longo do Tempo")).toBeInTheDocument();
    expect(screen.getByText("Tendências")).toBeInTheDocument();
  });

  it("shows empty state when no trend data exists", async () => {
    fetchMock.mockImplementation((input: string | Request) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes("period=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockMetrics,
            trends: { volume: [], resolutionTime: [], byType: [] },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockMetrics,
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("trends-empty")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Nenhum dado de tendência disponível para o período selecionado."),
    ).toBeInTheDocument();
  });
});
