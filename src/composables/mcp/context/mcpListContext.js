import {inject, provide} from "vue";

export const MCP_LIST_CONTEXT_KEY = Symbol("mcpListContext");

export function provideMcpList(context) {
  provide(MCP_LIST_CONTEXT_KEY, context || null);
}

export function useMcpList() {
  const context = inject(MCP_LIST_CONTEXT_KEY, null);
  if (!context) {
    throw new Error("useMcpList must be used within provideMcpList().");
  }
  return context;
}
