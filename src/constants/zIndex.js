/**
 * Application stacking-order tokens.
 *
 * Keep these values aligned with `src/assets/styles/foundations/tokens/z-index.css`.
 * Components should prefer CSS variables for rendering and this object for
 * JavaScript decisions/documentation so dialog, drawer, sheet, toast and
 * preview layers do not compete through ad-hoc numbers.
 */
export const Z_INDEX = Object.freeze({
  contentRaised: 20,
  prompt: 70,
  promptFloating: 90,
  sidebarCollapsed: 80,
  stickyControl: 100,
  drawerBackdrop: 800,
  drawer: 810,
  popover: 900,
  overlayBackdrop: 1200,
  overlayPanel: 1210,
  modalBackdrop: 1300,
  bottomSheetBackdrop: 1300,
  bottomSheet: 1310,
  modal: 1320,
  imagePreviewBackdrop: 1500,
  imagePreviewControl: 1510,
  feedbackDialog: 1600,
  toast: 3000,
  appDialog: 2147482500,
  chatHistoryMenuBackdrop: 2147482990,
  virtualKeyboardPanel: 2147482999,
  chatHistoryMenu: 2147483000,
  virtualKeyboardFab: 2147483000,
  appDialogFront: 2147483100,
});

export const Z_INDEX_CSS_VARIABLES = Object.freeze({
  contentRaised: "--z-content-raised",
  prompt: "--z-prompt",
  promptFloating: "--z-prompt-floating",
  sidebarCollapsed: "--z-sidebar-collapsed",
  stickyControl: "--z-sticky-control",
  drawerBackdrop: "--z-drawer-backdrop",
  drawer: "--z-drawer",
  popover: "--z-popover",
  overlayBackdrop: "--z-overlay-backdrop",
  overlayPanel: "--z-overlay-panel",
  modalBackdrop: "--z-modal-backdrop",
  bottomSheetBackdrop: "--z-bottom-sheet-backdrop",
  bottomSheet: "--z-bottom-sheet",
  modal: "--z-modal",
  imagePreviewBackdrop: "--z-image-preview-backdrop",
  imagePreviewControl: "--z-image-preview-control",
  feedbackDialog: "--z-feedback-dialog",
  toast: "--z-toast",
  appDialog: "--z-app-dialog",
  chatHistoryMenuBackdrop: "--z-chat-history-menu-backdrop",
  virtualKeyboardPanel: "--z-virtual-keyboard-panel",
  chatHistoryMenu: "--z-chat-history-menu",
  virtualKeyboardFab: "--z-virtual-keyboard-fab",
  appDialogFront: "--z-app-dialog-front",
});
