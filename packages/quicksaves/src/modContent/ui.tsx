import { FileDownloadOutlined, FileUploadOutlined } from '@mui/icons-material';
import { Box, Stack, StackProps, Typography } from '@mui/material';
import { ModReduxAPI } from 'afnm-types';
import React from 'react';
import { QuickSaves } from './quicksaves';
import { getSettings } from './settings';
import { stripEnd } from './utils';

const t = window.modAPI.utils.t;

export function injectUIs() {
  // NOTE: Changing settings causing a page re-render, so the changes will be reflected instantly
  window.modAPI.injectUI('combat', (api, element, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    return inject('#topBarLeftButtons', <QuickSaveButton {...api} />);
  });
  window.modAPI.injectUI('combat', (api, element, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    // Couldn't inject it into #topBarRightButtons since there's no way to set the injected element as the first sibling
    return inject(
      '#topBarRoundInfo',
      // `combat` screen seems to block pointer-events by default, #topBar*Buttons already has the property set
      <Box paddingTop="4px" marginLeft="8px" sx={{ pointerEvents: 'all' }}>
        <QuickLoadButton {...api} />
      </Box>,
      'inline',
    );
  });

  window.modAPI.injectUI('crafting', (api) => {
    if (!getSettings().showQuicksaveButtons) return;
    return (
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '138px', bottom: '0px', spacing: '5px' }}
      />
    );
  });

  window.modAPI.injectUI('dualCultivation', (api) => {
    if (!getSettings().showQuicksaveButtons) return;
    return (
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '50px', bottom: '3px', spacing: '5px' }}
      />
    );
  });

  window.modAPI.injectUI('event-player-ui', (api) => {
    if (!getSettings().showQuicksaveButtons) return;
    return (
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '3px', bottom: '140px', spacing: '5px' }}
      />
    );
  });

  window.modAPI.injectUI('player-ui', (api) => {
    if (!getSettings().showQuicksaveButtons) return;
    return (
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '62px', bottom: '0px', spacing: '0px' }}
      />
    );
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
        t('Failed creating quicksave: {err}', { err: String(err) }),
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

      // Some screens are independent of the game state due to performance reasons, for e.g. the `combat` screen, and so
      // the screen needs to be manually reset.
      window.modAPI.actions.triggerUIReset();

      window.modAPI.utils.showToast(
        t('Loaded {filename}', { filename: stripEnd(filename ?? '', '.json') }),
        undefined,
        'success',
      );
    } catch (err) {
      console.error(err);
      window.modAPI.utils.showToast(
        t('Failed loading quicksave: {err}', { err: String(err) }),
        undefined,
        'error',
      );
    }
  }
}

const QuickSaveLoadButtons: React.FC<{
  api: ModReduxAPI;
  stackProps?: StackProps;
}> = ({ api, stackProps }) => {
  return (
    <Stack
      id="quicksaveButtons"
      direction="row"
      zIndex={100}
      position="absolute"
      {...stackProps}
    >
      <QuickSaveButton {...api} />
      <QuickLoadButton {...api} />
    </Stack>
  );
};

const QuickSaveButton: React.FC<ModReduxAPI> = (api) => {
  return (
    // TODO: Add keybind key in tooltip `(${key})`
    <api.components.GameTooltip
      provider={() => (
        <api.components.GameTooltipBox>
          <Typography fontSize="120%">{t('Create quicksave')}</Typography>
        </api.components.GameTooltipBox>
      )}
    >
      <api.components.GameIconButton onClick={() => makeQuickSave(api)}>
        <FileDownloadOutlined />
      </api.components.GameIconButton>
    </api.components.GameTooltip>
  );
};

const QuickLoadButton: React.FC<ModReduxAPI> = (api) => {
  return (
    <api.components.GameTooltip
      provider={() => (
        <api.components.GameTooltipBox>
          <Typography fontSize="120%">{t('Load last quicksave')}</Typography>
        </api.components.GameTooltipBox>
      )}
    >
      <api.components.GameIconButton onClick={() => loadLastQuickSave(api)}>
        <FileUploadOutlined />
      </api.components.GameIconButton>
    </api.components.GameTooltip>
  );
};
