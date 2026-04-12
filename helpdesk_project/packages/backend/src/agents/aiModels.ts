import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI();

export const getClassificationModel = () =>
  openai(process.env.OPENAI_MODEL?.trim() || "gpt-5.4");

export const getImageValidationModel = () =>
  openai(
    process.env.OPENAI_ATTACHMENT_VALIDATION_MODEL?.trim() || "gpt-5.4-nano",
  );
