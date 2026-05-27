import './const';
import { patches, patchManager } from './patches';

Object.values(patches).forEach((patch) => {
  patchManager.tryEnable(patch);
});
