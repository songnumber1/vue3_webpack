export default function state() {
  return {
    theme: "light",
    isMobile: false,
    sidebarOpen: false,
    sidebarCollapsed: false,

    // Sidebar assistants section: collapsed shows pinned only; expanded shows all.
    assistantsExpanded: false,
  };
}
