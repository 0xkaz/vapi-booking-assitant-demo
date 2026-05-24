/**
 * Type definitions for VAPI Server URL payloads.
 * https://docs.vapi.ai/server-url/events
 */

export interface VapiToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface VapiServerRequest {
  message: {
    type: 'tool-calls';
    call: unknown;
    toolCallList: VapiToolCall[];
    toolWithToolCallList?: unknown[];
  };
}

export interface VapiToolResult {
  toolCallId: string;
  name: string;
  result: string;
}

export interface VapiServerResponse {
  results: VapiToolResult[];
}
