import { useTranslation } from "react-i18next";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ChatToolCallPart from "@/components/ChatToolCallPart";
import { Bot, User } from "lucide-react";

function UserMessage() {
  return (
    <div className="flex items-start justify-end gap-2">
      <div className="max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
        <MessagePrimitive.Content />
      </div>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
        aria-hidden
      >
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

function AssistantMessage() {
  return (
    <div className="flex items-start justify-start gap-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden
      >
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm">
        <MessagePrimitive.Content
          components={{
            tools: { Fallback: ChatToolCallPart },
          }}
        />
      </div>
    </div>
  );
}

function ChatThread() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <ThreadPrimitive.Messages
          components={{ UserMessage, AssistantMessage }}
        />
        <ThreadPrimitive.Empty>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("chat.placeholder")}
          </p>
        </ThreadPrimitive.Empty>
      </div>
      <div className="border-t p-4">
        <ComposerPrimitive.Root className="flex gap-2">
          <ComposerPrimitive.Input
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <ComposerPrimitive.Send asChild>
            <Button size="sm">{t("common.send")}</Button>
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </div>
  );
}

function ChatAssistant() {
  const { t } = useTranslation();
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({ api: "/api/chat/messages" }),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {t("chat.openChat")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("chat.title")}</SheetTitle>
          <SheetDescription>{t("chat.description")}</SheetDescription>
        </SheetHeader>
        <AssistantRuntimeProvider runtime={runtime}>
          <ChatThread />
        </AssistantRuntimeProvider>
      </SheetContent>
    </Sheet>
  );
}

export default ChatAssistant;
