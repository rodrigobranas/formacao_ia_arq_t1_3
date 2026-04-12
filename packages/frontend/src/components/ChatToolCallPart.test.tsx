import { render, screen } from "@testing-library/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import ChatToolCallPart from "./ChatToolCallPart";

const createProps = (
  overrides: Partial<ToolCallMessagePartProps> = {},
): ToolCallMessagePartProps => ({
  type: "tool-call",
  toolCallId: "call-1",
  toolName: "listTickets",
  args: { limit: 10 },
  argsText: "",
  status: { type: "complete" },
  addResult: vi.fn(),
  resume: vi.fn(),
  ...overrides,
});

describe("ChatToolCallPart", () => {
  it("shows tool name and running label when status is running", () => {
    render(
      <ChatToolCallPart
        {...createProps({ status: { type: "running" }, result: undefined })}
      />,
    );

    expect(screen.getByText("listTickets")).toBeInTheDocument();
    expect(screen.getByText("Executando…")).toBeInTheDocument();
  });

  it("shows args from argsText when present", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          argsText: '{"search":"wifi"}',
          args: {},
        })}
      />,
    );

    expect(screen.getByText('{"search":"wifi"}')).toBeInTheDocument();
  });

  it("shows stringified args when argsText is empty", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          argsText: "   ",
          args: { limit: 5 },
        })}
      />,
    );

    expect(screen.getByText(/"limit"\s*:\s*5/)).toBeInTheDocument();
  });

  it("shows result JSON when result is defined", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          result: { total: 3, data: [] },
        })}
      />,
    );

    expect(screen.getByText(/"total"\s*:\s*3/)).toBeInTheDocument();
  });

  it("applies error styles when isError is true", () => {
    const { container } = render(
      <ChatToolCallPart {...createProps({ isError: true })} />,
    );

    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain("border-destructive");
  });

  it("shows incomplete message when tool ends incomplete", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          status: { type: "incomplete", reason: "error" },
        })}
      />,
    );

    expect(
      screen.getByText("A ferramenta não concluiu."),
    ).toBeInTheDocument();
  });

  it("shows cancelled message when incomplete reason is cancelled", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          status: { type: "incomplete", reason: "cancelled" },
        })}
      />,
    );

    expect(
      screen.getByText("A execução da ferramenta foi cancelada."),
    ).toBeInTheDocument();
  });

  it("shows needs-action message for requires-action status", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          status: { type: "requires-action", reason: "interrupt" },
        })}
      />,
    );

    expect(
      screen.getByText("Esta etapa precisa da sua ação no aplicativo."),
    ).toBeInTheDocument();
  });

  it("falls back to String() when JSON.stringify throws for result", () => {
    render(
      <ChatToolCallPart
        {...createProps({
          result: BigInt(99) as unknown as Record<string, unknown>,
        })}
      />,
    );

    expect(screen.getByText("99")).toBeInTheDocument();
  });

  it("falls back to String() when JSON.stringify throws for args preview", () => {
    const circular: Record<string, unknown> = {};
    circular.ref = circular;

    render(
      <ChatToolCallPart
        {...createProps({
          argsText: "",
          args: circular as ToolCallMessagePartProps["args"],
        })}
      />,
    );

    expect(screen.getByText(/\[object Object\]|ref/)).toBeInTheDocument();
  });
});
