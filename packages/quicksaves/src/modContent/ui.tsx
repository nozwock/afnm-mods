import { FileDownloadOutlined, FileUploadOutlined } from '@mui/icons-material';
import { Stack, StackProps, Typography } from '@mui/material';
import { ModReduxAPI } from 'afnm-types';
import { stripEnd } from 'common/utils';
import React from 'react';
import { QuickSaves } from './quicksaves';
import { actionQuickLoad, actionQuickSave, getSettings } from './settings';

const t = window.modAPI.utils.t;

export function injectUIs() {
  // NOTE: Changing settings causing a page re-render, so the changes will be reflected instantly
  window.modAPI.injectUI('combat', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject('#topBarLeftButtons', <QuickSaveButton {...api} />, 'appendChild');
  });
  window.modAPI.injectUI('combat', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject('#topBarRightButtons', <QuickLoadButton {...api} />, 'prependChild');
  });

  window.modAPI.injectUI('crafting', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject(
      '',
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '138px', bottom: '0px', spacing: '5px' }}
      />,
      'after',
    );
  });

  window.modAPI.injectUI('dualCultivation', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject(
      '',
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '50px', bottom: '3px', spacing: '5px' }}
      />,
      'after',
    );
  });

  window.modAPI.injectUI('event-player-ui', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject(
      '',
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '3px', bottom: '140px', spacing: '5px' }}
      />,
      'after',
    );
  });

  window.modAPI.injectUI('player-ui', (api, inject) => {
    if (!getSettings().showQuicksaveButtons) return;
    inject(
      '',
      <QuickSaveLoadButtons
        api={api}
        stackProps={{ left: '62px', bottom: '0px', spacing: '0px' }}
      />,
      'after',
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
  const GameTooltip = api.components.GameTooltip;
  const GameTooltipBox = api.components.GameTooltipBox;
  const GameIconButton = api.components.GameIconButton;
  return (
    <GameTooltip
      provider={() => (
        <GameTooltipBox>
          <Typography fontSize="120%">
            {t('Create quicksave')}{' '}
            <span style={{ opacity: 0.7 }}>
              (
              {
                window.modAPI.utils.getRegisteredKeybindValue(actionQuickSave)
                  ?.displayText
              }
              )
            </span>
          </Typography>
        </GameTooltipBox>
      )}
    >
      <GameIconButton onClick={() => makeQuickSave(api)}>
        <FileDownloadOutlined />
      </GameIconButton>
    </GameTooltip>
  );
};

const QuickLoadButton: React.FC<ModReduxAPI> = (api) => {
  const GameTooltip = api.components.GameTooltip;
  const GameTooltipBox = api.components.GameTooltipBox;
  const GameIconButton = api.components.GameIconButton;
  return (
    <GameTooltip
      provider={() => (
        <GameTooltipBox>
          <Typography fontSize="120%">
            {t('Load last quicksave')}{' '}
            <span style={{ opacity: 0.7 }}>
              (
              {
                window.modAPI.utils.getRegisteredKeybindValue(actionQuickLoad)
                  ?.displayText
              }
              )
            </span>
          </Typography>
        </GameTooltipBox>
      )}
    >
      <GameIconButton onClick={() => loadLastQuickSave(api)}>
        <FileUploadOutlined />
      </GameIconButton>
    </GameTooltip>
  );
};
