import { AgentMailClient } from "agentmail";

export function getAgentMailApiKey(): string | undefined {
  const key = process.env.AGENTMAIL_API_KEY?.trim();
  return key || undefined;
}

export function createAgentMailClient(): AgentMailClient {
  const apiKey = getAgentMailApiKey();
  if (!apiKey) {
    throw new Error("AGENTMAIL_API_KEY is not set");
  }
  return new AgentMailClient({ apiKey });
}

export function isAgentMailConfigured(): boolean {
  return Boolean(getAgentMailApiKey());
}
