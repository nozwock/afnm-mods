import { FeatureManager } from './features';
import { ModSettings } from './settings';

window.modAPI.actions.registerOptionsUI(ModSettings);

FeatureManager.getAll().forEach((feature) => {
  feature.initialize();
});
