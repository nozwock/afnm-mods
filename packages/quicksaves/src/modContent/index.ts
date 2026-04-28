import { QuickSaves } from './quicksaves';
import { QuickSaveButtons } from './ui';

// TODO: `combat` screen, awaiting on the top bar flex container getting an `id`

window.modAPI.injectUI('crafting', (api, element, inject) => {
  return inject(
    '#backgroundImage',
    QuickSaveButtons(api, '138px', '3px', '5px'),
    'inline',
  );
});

window.modAPI.injectUI('dualCultivation', (api, element, inject) => {
  return inject(
    '#backgroundImage',
    QuickSaveButtons(api, '50px', '3px', '5px'),
    'inline',
  );
});

window.modAPI.injectUI('event', (api, element, inject) => {
  return inject(
    '#backgroundImage',
    QuickSaveButtons(api, '3px', '140px', '5px'),
    'inline',
  );
});

// TODO: Waiting for player UI components to have an `id` to target instead of every screen they appear in.
window.modAPI.injectUI('map', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('location', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('market', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('herbField', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('recipe', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('auction', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('mysticalRegion', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('house', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});
window.modAPI.injectUI('guild', (api, element, inject) => {
  return inject('#backgroundImage', QuickSaveButtons(api), 'inline');
});

// TODO: Add toasts for quick save/load, awaiting on a toast API or component in 0.6.53,
window.addEventListener('keyup', (e) => {
  if (e.key === 'F5') {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    QuickSaves.makeQuickSave();
  } else if (e.key === 'F9') {
    QuickSaves.loadLastQuickSave();
  }
});
