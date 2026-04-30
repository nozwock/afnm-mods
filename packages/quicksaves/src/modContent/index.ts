import { ModSettings } from './settings';
import { injectUIs, loadLastQuickSave, makeQuickSave } from './ui';

window.modAPI.actions.registerOptionsUI(ModSettings);
injectUIs();

window.addEventListener('keyup', (e) => {
  // XXX Would need to check for .showQuicksaveButtons here if .useKeybindings is to be used in the future
  if (e.key === 'F5') {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    makeQuickSave();
  } else if (e.key === 'F9') {
    loadLastQuickSave();
  }
});
