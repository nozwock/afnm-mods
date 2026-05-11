import { patchManager, patches } from './patches';
import { ModSettings } from './settings';

window.modAPI.actions.registerOptionsUI(ModSettings);

Object.values(patches).forEach((patch) => {
  patchManager.tryEnable(patch);
});
