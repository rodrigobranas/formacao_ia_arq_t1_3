import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  authMiddleware,
  type AuthenticatedRequest,
} from "../data/authMiddleware";
import { getClassificationModel } from "./aiModels";
import { createHelpdeskOperatorTools } from "./helpdeskTools";

export const SYSTEM_PROMPT = `You are a helpdesk operator assistant. You answer questions about support tickets for the operator's organization.

Rules:
- Use only data returned by the tools. Do not invent ticket ids, codes, or customer details.
- If the user asks for exhaustive lists and the listTickets result shows total is larger than the number of rows returned, say so and offer to narrow the search or paginate (offset).
- When referencing tickets, prefer the ticket code (e.g. TK-...) and id when helpful.
- Reply in the same language as the user's question.`;

const questionBodySchema = z.object({
  prompt: z.string().min(1, "prompt is required"),
});

export const chatRoutes = Router();
chatRoutes.use(authMiddleware);

chatRoutes.post(
  "/messages",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = (req as AuthenticatedRequest).user;
      const { messages } = req.body as { messages: UIMessage[] };
      const modelMessages = await convertToModelMessages(messages);

      const tools = createHelpdeskOperatorTools({ organizationId });

      const result = streamText({
        model: getClassificationModel(),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        stopWhen: stepCountIs(12),
        tools,
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      next(error);
    }
  },
);

chatRoutes.post(
  "/question",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = questionBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid request body" });
        return;
      }

      const { organizationId } = (req as AuthenticatedRequest).user;
      const tools = createHelpdeskOperatorTools({ organizationId });

      const result = streamText({
        model: getClassificationModel(),
        system: SYSTEM_PROMPT,
        prompt: parsed.data.prompt,
        stopWhen: stepCountIs(12),
        tools,
      });

      for await (const chunk of result.toUIMessageStream()) {
        console.log("chunk", chunk);
      }

      result.pipeTextStreamToResponse(res);
    } catch (error) {
      next(error);
    }
  },
);
