import { loadStore, normalizeStore } from "@/storage/chatStore";

export default function state() {
  return {
    store: normalizeStore(loadStore()),
  };
}
