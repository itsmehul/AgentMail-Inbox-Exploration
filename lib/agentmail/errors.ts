import { AgentMailError } from "agentmail";

export function agentMailErrorMessage(error: unknown): string {
  if (error instanceof AgentMailError) {
    const body = error.body as { message?: string } | undefined;
    if (body?.message) return body.message;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown AgentMail error";
}
