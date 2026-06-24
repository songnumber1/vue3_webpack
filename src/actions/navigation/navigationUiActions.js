import {useNavigationStore} from "@/stores/navigationStore";

export function closeNavigationDrawer() {
  useNavigationStore().setDrawerOpen(false);
}

export function closeNavigationDrawerAndCollapsedRecent() {
  const navigationStore = useNavigationStore();
  navigationStore.setDrawerOpen(false);
  navigationStore.setCollapsedRecentOpen(false);
}

export function closeNavigationDrawerAndTransientPanels() {
  const navigationStore = useNavigationStore();
  navigationStore.closeTransientPanels?.();
  navigationStore.setDrawerOpen(false);
}
