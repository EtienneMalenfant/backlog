// Renderer-side settings repository — thin async wrapper over IPC.
// The keyBindings default object is kept here as pure data (no Node dependency).

const keyBindings = {
  acceptItemChange: { mac: ['meta', 'enter'], win: ['ctrl', 'enter'] },
  addNewBoard:      { win: ['ctrl', 'shift', 'n'], mac: ['meta', 'shift', 'n'] },
  cancelItemChange: { mac: ['esc'], win: ['esc'] },
  filterItemsFocus: { mac: ['meta', 'f'], win: ['ctrl', 'f'] },
  newItemFocus:     { mac: ['meta', 'n'], win: ['ctrl', 'n'] },
  nextTab:          { win: ['ctrl', 'shift', '}'], mac: ['meta', 'shift', ']'] },
  prevTab:          { win: ['ctrl', 'shift', '{'], mac: ['meta', 'shift', '['] },
  showEmoji:        { readonly: true, mac: ['meta', 'e'], win: ['ctrl', 'e'] },
  showFindItem:     { mac: ['meta', 'shift', 'f'], win: ['ctrl', 'shift', 'f'] },
  showKeymap:       { win: ['ctrl', 'k'], mac: ['meta', 'k'] },
};

export default {
  addKeyBinding(keyId, keyCombinations) {
    return window.electronAPI.db.settings.addKeyBinding(keyId, keyCombinations);
  },
  getAppSettings() {
    return window.electronAPI.db.settings.getAppSettings();
  },
  getKeyBindings() {
    return window.electronAPI.db.settings.getKeyBindings();
  },
  hasKeyBindingsProperty() {
    return window.electronAPI.db.settings.hasKeyBindingsProperty();
  },
  hasLanguageProperty() {
    return window.electronAPI.db.settings.hasLanguageProperty();
  },
  keyBindings,
  setupKeyBindings() {
    return window.electronAPI.db.settings.setupKeyBindings();
  },
  updateAppSettings(updateProp) {
    return window.electronAPI.db.settings.updateAppSettings(updateProp);
  },
  updateKeyBinding(keyId, combination, isMac) {
    return window.electronAPI.db.settings.updateKeyBinding(keyId, combination, isMac);
  },
};
