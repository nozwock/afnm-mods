import './settings';
import { injectUIs, loadLastQuickSave, makeQuickSave } from './ui';

injectUIs();

window.addEventListener('keyup', (e) => {
  if (e.key === 'F5') {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    makeQuickSave();
  } else if (e.key === 'F9') {
    loadLastQuickSave();
  }
});
