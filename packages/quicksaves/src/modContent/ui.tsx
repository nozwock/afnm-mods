import { Box, Stack, SvgIcon, Typography } from '@mui/material';
import { ModReduxAPI } from 'afnm-types';
import { QuickSaves } from './quicksaves';
import { stripEnd } from './utils';

const t = window.modAPI.utils.t;

export function injectUIs() {
  window.modAPI.injectUI('combat', (api, element, inject) => {
    return inject('#topBarLeftButtons', makeQuickSaveButton(api));
  });
  window.modAPI.injectUI('combat', (api, element, inject) => {
    // Couldn't inject it into #topBarRightButtons since there's no way to set the injected element as the first sibling
    return inject(
      '#topBarRoundInfo',
      <Box paddingTop="4px" marginLeft="8px" sx={{ pointerEvents: 'all' }}>
        {loadQuickSaveButton(api)}
      </Box>,
      'inline',
    );
  });

  window.modAPI.injectUI('crafting', (api) => {
    return quickSaveButtons(api, '138px', '0px', '5px');
  });

  window.modAPI.injectUI('dualCultivation', (api) => {
    return quickSaveButtons(api, '50px', '3px', '5px');
  });

  window.modAPI.injectUI('event-player-ui', (api) => {
    return quickSaveButtons(api, '3px', '140px', '5px');
  });

  window.modAPI.injectUI('player-ui', (api) => {
    return quickSaveButtons(api);
  });
}

export async function makeQuickSave(api?: ModReduxAPI) {
  if (!api || api.hasSave) {
    try {
      const filename = await QuickSaves.makeQuickSave();
      window.modAPI.utils.showToast(
        t('Saved {filename}', { filename: stripEnd(filename, '.json') }),
        undefined,
        'success',
      );
    } catch (err) {
      console.error(err);
      window.modAPI.utils.showToast(
        t('Failed creating quick-save: {err}', { err: String(err) }),
        undefined,
        'error',
      );
    }
  }
}

export async function loadLastQuickSave(api?: ModReduxAPI) {
  if (!api || api.hasSave) {
    try {
      const filename = await QuickSaves.loadLastQuickSave();
      window.modAPI.utils.showToast(
        t('Loaded {filename}', { filename: stripEnd(filename ?? '', '.json') }),
        undefined,
        'success',
      );
    } catch (err) {
      console.error(err);
      window.modAPI.utils.showToast(
        t('Failed loading quick-save: {err}', { err: String(err) }),
        undefined,
        'error',
      );
    }
  }
}

function LoadIcon() {
  return (
    <SvgIcon>
      <svg fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3zM7 9l1.41 1.41L11 7.83V16h2V7.83l2.59 2.58L17 9l-5-5z"></path>
      </svg>
    </SvgIcon>
  );
}

function SaveIcon() {
  return (
    <SvgIcon>
      <svg fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3zm-1-4-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5z"></path>
      </svg>
    </SvgIcon>
  );
}

function makeQuickSaveButton(api: ModReduxAPI) {
  return (
    // TODO: Add keybind key in tooltip `(${key})`
    <api.components.GameTooltip
      provider={() => (
        <api.components.GameTooltipBox>
          <Typography fontSize="120%">{t('Quick-save')}</Typography>
        </api.components.GameTooltipBox>
      )}
    >
      <api.components.GameIconButton onClick={() => makeQuickSave(api)}>
        <SaveIcon />
      </api.components.GameIconButton>
    </api.components.GameTooltip>
  );
}

function loadQuickSaveButton(api: ModReduxAPI) {
  return (
    <api.components.GameTooltip
      provider={() => (
        <api.components.GameTooltipBox>
          <Typography fontSize="120%">{t('Load last quick-save')}</Typography>
        </api.components.GameTooltipBox>
      )}
    >
      <api.components.GameIconButton onClick={() => loadLastQuickSave(api)}>
        <LoadIcon />
      </api.components.GameIconButton>
    </api.components.GameTooltip>
  );
}

function quickSaveButtons(
  api: ModReduxAPI,
  left?: string,
  bottom?: string,
  spacing?: string,
) {
  left = left ?? '62px';
  bottom = bottom ?? '0px';
  spacing = spacing ?? '0px';
  return (
    <Stack
      id="quicksaveButtons"
      position="absolute"
      zIndex={100}
      left={left}
      bottom={bottom}
      direction="row"
      spacing={spacing}
    >
      {makeQuickSaveButton(api)}
      {loadQuickSaveButton(api)}
    </Stack>
  );
}
