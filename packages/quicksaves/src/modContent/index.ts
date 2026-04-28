import { QuickSaves } from './quicksaves';

// TODO: Add toasts for quick save/load, awaiting on a toast API or component in 0.6.53,
window.addEventListener('keyup', (e) => {
  if (e.key === 'F5') {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    QuickSaves.makeQuickSave();
  } else if (e.key === 'F9') {
    QuickSaves.loadLastQuickSave();
  }
});
