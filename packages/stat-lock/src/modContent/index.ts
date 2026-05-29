import './const';
import { patches, patchManager } from './patches';
import { ModSettings } from './settings';
import { registerUI } from './ui';

window.modAPI.actions.registerOptionsUI(ModSettings);

Object.values(patches).forEach((patch) => {
  patchManager.tryEnable(patch);
});

registerUI();
