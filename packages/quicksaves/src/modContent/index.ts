import { matchRegisteredKeybind } from 'common/utils';
import { QuickSaves } from './quicksaves';
import {
  actionQuickLoad,
  actionQuickSave,
  getSettings,
  ModSettings,
  registerKeybindings,
} from './settings';
import { injectUIs, loadLastQuickSave, makeQuickSave } from './ui';

const settings = getSettings();
QuickSaves.slotCapacity = settings.maxQuicksaves;

window.modAPI.actions.registerOptionsUI(ModSettings);
registerKeybindings();

injectUIs();

window.addEventListener('keyup', (e) => {
  // XXX Would need to check for .showQuicksaveButtons here if .useKeybindings is to be used in the future
  if (
    // Probably not going to use .useKeybindings for a long time, since it's kinda messy with the whole priority system
    // disabling lower priority non-conflicting keybinds, at least as of 0.6.54
    matchRegisteredKeybind(actionQuickSave, e)
  ) {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    makeQuickSave();
  } else if (matchRegisteredKeybind(actionQuickLoad, e)) {
    loadLastQuickSave();
  }
});
