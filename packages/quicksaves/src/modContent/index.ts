import { loadLastQuickSave, makeQuickSave, QuickSaveButtons } from './ui';

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

window.modAPI.injectUI('event-player-ui', (api) => {
  return QuickSaveButtons(api, '3px', '140px', '5px');
});

window.modAPI.injectUI('player-ui', (api) => {
  return QuickSaveButtons(api);
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'F5') {
    // TODO: Prevent from being called in main menu as these only work when in game-world
    makeQuickSave();
  } else if (e.key === 'F9') {
    loadLastQuickSave();
  }
});
