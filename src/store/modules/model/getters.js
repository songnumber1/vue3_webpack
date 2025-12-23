export default {
  groups: (s) => s.groups || [],
  groupLabel: (s, g) =>
    (g.groups.find((x) => x.id === s.groupId) || {}).label || s.groupId,
  modelsForGroup: (s, g) =>
    (g.groups.find((x) => x.id === s.groupId) || {}).models || [],
  currentModelLabel: (s, g) =>
    (g.modelsForGroup.find((m) => m.id === s.modelId) || {}).label || s.modelId,
};
