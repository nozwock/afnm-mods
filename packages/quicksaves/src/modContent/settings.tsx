import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Slider,
  Typography,
} from '@mui/material';
import { ModOptionsFC } from 'afnm-types';
import { useState } from 'react';
import { MOD_ID } from './const';
import { QuickSaves } from './quicksaves';

const t = window.modAPI.utils.t;
const keyMaxQuicksaves = `${MOD_ID}.maxQuicksaves`;
const keyShowQuicksaveButtons = `${MOD_ID}.showQuicksaveButtons`;

export const actionQuickSave = `${MOD_ID}.quickSave`;
export const actionQuickLoad = `${MOD_ID}.quickLoad`;

export function getSettings() {
  // NOTE: Use localstorage for complex persistent data not tied to save files
  const gameFlags = window.modAPI.actions.getGlobalFlags();
  return {
    maxQuicksaves: gameFlags[keyMaxQuicksaves] ?? 3,
    showQuicksaveButtons: Boolean(gameFlags[keyShowQuicksaveButtons] ?? 1),
  };
}

export function registerKeybindings() {
  window.modAPI.actions.registerKeybinding({
    action: actionQuickSave,
    category: 'ui',
    displayName: 'Quick Save',
    description: 'Create quicksave',
    defaultKey: 'F5',
    allowRebind: true,
  });

  window.modAPI.actions.registerKeybinding({
    action: actionQuickLoad,
    category: 'ui',
    displayName: 'Quick Load',
    description: 'Load last quicksave',
    defaultKey: 'F9',
    allowRebind: true,
  });
}

export const ModSettings: ModOptionsFC = ({ api }) => {
  const [settings, setSettings] = useState(getSettings);

  return (
    <Box
      marginTop="40px"
      display="flex"
      flexDirection="column"
      gap="16px"
      // With 0.6.54, game sets overflow on ModOption component's container but we don't want horizontal scrolling
      sx={{ overflowX: 'hidden' }}
    >
      <Box>
        <FormGroup>
          <FormControlLabel
            label={t('Show Quicksave Buttons')}
            control={
              <Checkbox
                checked={settings.showQuicksaveButtons}
                onChange={(_, value) => {
                  window.modAPI.actions.setGlobalFlag(
                    keyShowQuicksaveButtons,
                    Number(value),
                  );
                  setSettings((it) => ({
                    ...it,
                    showQuicksaveButtons: value,
                  }));
                }}
              />
            }
          ></FormControlLabel>
        </FormGroup>
      </Box>
      <Box>
        <Typography fontSize="120%">
          {t('Max Quicksaves: {slots}', {
            slots: settings.maxQuicksaves,
          })}
        </Typography>
        <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
          {t(
            'Quickload uses only the most recent quicksave. The others serve as backups.',
          )}
        </Typography>
        <Slider
          value={settings.maxQuicksaves}
          onChange={(_, value) => {
            QuickSaves.slotCapacity = value;
            window.modAPI.actions.setGlobalFlag(keyMaxQuicksaves, value);
            setSettings((it) => ({
              ...it,
              maxQuicksaves: value,
            }));
          }}
          step={1}
          marks
          min={1}
          max={20}
        ></Slider>
      </Box>
    </Box>
  );
};
