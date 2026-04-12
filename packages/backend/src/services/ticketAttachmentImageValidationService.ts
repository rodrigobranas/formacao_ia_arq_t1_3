import { generateText, Output } from "ai";
import { z } from "zod";
import { getImageValidationModel } from "../agents/aiModels";
import { TicketClassifyExternalError } from "./ticketClassifyService";
import { ValidationError } from "./ticketTypeService";

const imageValidationSchema = z.object({
  valid_for_support_ticket: z.boolean(),
  rejection_reason: z.string(),
});

function buildUserText(description: string, filename: string): string {
  return [
    "You validate images attached to a new customer support ticket.",
    "Decide if this image is suitable for support (e.g. screenshots, error messages, product/UI issues, readable documents related to the problem).",
    "Reject irrelevant content (memes, unrelated photos, spam, personal images with no link to the issue, etc.).",
    "Also check that the image content correlates with the ticket description below.",
    "",
    `Ticket description:\n${description}`,
    "",
    `Attachment filename: ${filename}`,
  ].join("\n");
}

export async function validateSupportTicketImages(
  description: string,
  attachments:
    | ReadonlyArray<{ filename: string; contentType: string; content: string }>
    | undefined,
): Promise<void> {
  if (!attachments?.length) return;

  const imageAttachments = attachments.filter((a) =>
    a.contentType.toLowerCase().startsWith("image/"),
  );
  if (imageAttachments.length === 0) return;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new TicketClassifyExternalError("OpenAI API key is not configured");
  }

  for (const attachment of imageAttachments) {
    const dataUrl = `data:${attachment.contentType};base64,${attachment.content}`;

    let result: Awaited<ReturnType<typeof generateText>>;
    try {
      result = await generateText({
        model: getImageValidationModel(),
        output: Output.object({
          schema: imageValidationSchema,
          name: "support_ticket_image_validation",
          description:
            "Whether the image is valid for a support ticket and why it may be rejected",
        }),
        system:
          "You validate support-ticket image attachments. Reply only with structured JSON matching the schema. Set rejection_reason to an empty string when valid_for_support_ticket is true.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: buildUserText(description, attachment.filename),
              },
              { type: "image", image: dataUrl },
            ],
          },
        ],
      });
    } catch {
      throw new TicketClassifyExternalError("Classification request failed");
    }

    const output = result.output;
    if (!output) {
      throw new TicketClassifyExternalError("Invalid classification result");
    }

    if (!output.valid_for_support_ticket) {
      const reason =
        output.rejection_reason.trim() ||
        "The image was not accepted for this support ticket.";
      throw new ValidationError(
        `Image "${attachment.filename}" was rejected: ${reason}`,
      );
    }
  }
}
