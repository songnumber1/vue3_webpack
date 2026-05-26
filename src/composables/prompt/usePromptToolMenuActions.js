import {computed, ref} from "vue";

export function usePromptToolMenuActions({tools, emit, onGroupOpen} = {}) {
  const activeToolGroupId = ref("");

  const activeToolGroup = computed(() => {
    const items = typeof tools === "function" ? tools() : tools?.value || [];
    return items.find((tool) => tool.id === activeToolGroupId.value) || null;
  });

  function hasChildren(tool) {
    return Array.isArray(tool?.children) && tool.children.length > 0;
  }

  function isSwitchParent(tool) {
    return tool?.parentControlType === "switch";
  }

  function isCheckboxChild(tool) {
    return tool?.controlType === "checkbox";
  }

  function getChildRole(tool) {
    return tool?.selectionMode === "single"
      ? "menuitemradio"
      : "menuitemcheckbox";
  }

  async function openToolGroup(tool) {
    activeToolGroupId.value = tool.id;
    await onGroupOpen?.(tool);
  }

  async function handleToolClick(tool) {
    if (!hasChildren(tool)) {
      emit("apply-tool", tool);
      return;
    }

    if (activeToolGroupId.value === tool.id) {
      closeActiveToolGroup();
      return;
    }

    activeToolGroupId.value = "";
    await openToolGroup(tool);
  }

  async function handleToolSwitchClick(tool) {
    if (!isSwitchParent(tool)) return;

    const willEnable = !tool.active;
    emit("apply-tool", tool);

    activeToolGroupId.value = "";
    if (willEnable) await openToolGroup(tool);
  }

  function closeActiveToolGroup() {
    const group = activeToolGroup.value;
    if (isSwitchParent(group) && group.active && group.activeCount === 0) {
      emit("apply-tool", group);
    }
    activeToolGroupId.value = "";
  }

  return {
    activeToolGroupId,
    activeToolGroup,
    hasChildren,
    isSwitchParent,
    isCheckboxChild,
    getChildRole,
    handleToolClick,
    handleToolSwitchClick,
    closeActiveToolGroup,
  };
}
