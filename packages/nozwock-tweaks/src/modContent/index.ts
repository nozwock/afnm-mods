import { FeatureManager } from './features';

FeatureManager.getAll().forEach((feature) => {
  feature.initialize();
});
