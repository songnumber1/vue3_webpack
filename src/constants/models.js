// Model groups shown in the sidebar + landing screen.
// UI/UX only: 실제 API 연동 전까지는 id/label만 사용합니다.

export const MODEL_GROUPS = [
  {
    id: "ds",
    label: "DS Assistant",
    models: [
      { id: "ds-default", label: "Default" },
      { id: "ds-fast", label: "Fast" },
      { id: "ds-pro", label: "Pro" },
    ],
  },
  {
    id: "spec",
    label: "Spec Assistant",
    models: [
      { id: "spec-default", label: "Default" },
      { id: "spec-review", label: "Review" },
    ],
  },
  {
    id: "ops",
    label: "Ops Assistant",
    models: [
      { id: "ops-default", label: "Default" },
      { id: "ops-debug", label: "Debug" },
    ],
  },
];

export function getDefaultModelId(groupId) {
  const g = MODEL_GROUPS.find((x) => x.id === groupId) || MODEL_GROUPS[0];
  return g?.models?.[0]?.id || "";
}
