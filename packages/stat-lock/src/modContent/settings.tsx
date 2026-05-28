import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { ModOptionsFC, PhysicalStatistic, statToName } from 'afnm-types';
import { getSaveModData, useSaveModData } from 'common/config';
import { produce } from 'immer';
import { useEffect, useState } from 'react';
import { defaultModConfig, ModConfig, saveConfigKey } from './config';
import { MOD_ID } from './const';
import { patches, patchManager } from './patches';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const GameButton = api.components.GameButton;
  const GameDialog = api.components.GameDialog;

  const [showAlert, setShowAlert] = useState(false);
  const saveConfig = useSaveModData<ModConfig>(
    api,
    MOD_ID,
    saveConfigKey,
    () => defaultModConfig,
  );

  function setSaveModConfig(updater: (config: ModConfig) => ModConfig) {
    if (!api.hasSave) {
      setShowAlert(true);
      return;
    }

    const config = getSaveModData<ModConfig>(MOD_ID, saveConfigKey);
    if (config) api.actions.setModData(MOD_ID, saveConfigKey, updater(config));
  }

  useEffect(
    () =>
      function onUnmount() {
        if (!api.hasSave) return; // In main-menu
        const state = window.modAPI.getGameStateSnapshot()!;
        const updatedPlayer = produce(state.player.player, (player) => {
          patches.lockPhysicalStats._tryLockStats(player, state);
        });
        if (state.player.player !== updatedPlayer) {
          api.actions.updatePlayer(updatedPlayer);
        }
      },
    [],
  );

  return (
    <Box display="flex" flexDirection="column" gap={2} marginY={5}>
      {showAlert && (
        <GameDialog
          id="nozwock-stat-lock-settings-alert"
          title={t('Notice')}
          width="sm"
          height="30vh"
          showBackdrop
          onClose={() => setShowAlert(false)}
        >
          <Stack height="100%" m={5}>
            <Stack height="100%" alignItems="center" justifyContent="center">
              <Typography fontSize="120%">
                {t('Settings can only be changed while a save is loaded.')}
              </Typography>
            </Stack>

            <Stack direction="row" mt="auto" justifyContent="center">
              <GameButton onClick={() => setShowAlert(false)}>
                {t('Continue')}
              </GameButton>
            </Stack>
          </Stack>
        </GameDialog>
      )}

      <Stack direction="row">
        <Typography fontSize="200%">{t('Stat Lock')}</Typography>
        <GameButton
          sx={{ ml: 'auto' }}
          size="small"
          onClick={() => {
            if (!api.hasSave) return;
            api.actions.setModData(MOD_ID, saveConfigKey, defaultModConfig);
            Object.values(patches).forEach((patch) => {
              patchManager.setEnabled(patch);
            });
          }}
        >
          {t('Reset All to Defaults')}
        </GameButton>
      </Stack>

      <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
        {t(
          `Do note that there is no way to restore stats back to what they were once the mod has made any changes to \
stats, other than restoring a previous save.`,
        )}
      </Typography>

      <Stack>
        <FormControlLabel
          // XXX Maybe have enablement per character instead of per save. This way the mod won't be disabled if the user
          // loads a previous save (quickloads, etc) after having enabled the mod in a more recent save.
          label={t('Enable Mod for Current Save')}
          control={
            <Checkbox
              checked={saveConfig?.modEnabled ?? false}
              onChange={(_, checked) => {
                setSaveModConfig((config) => ({
                  ...config,
                  modEnabled: checked,
                }));
              }}
            />
          }
        />
        <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
          {t(
            "The mod needs to be enabled separately for each new save if it isn't enabled in already.",
          )}
        </Typography>
      </Stack>

      <Stack>
        <Typography fontSize="200%">{t('Physical Stats')}</Typography>
        <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
          {t('Lock stats to specific values individually.')}
        </Typography>
      </Stack>

      <Stack direction="column" spacing={1}>
        {Object.entries(saveConfig.lockedPhysicalStats).map(([stat, it]) => (
          <Stack direction="row" alignItems="center">
            <Typography>{t(statToName[stat as PhysicalStatistic])}</Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ ml: 'auto' }}
              alignItems="center"
            >
              <Switch
                checked={it.locked}
                onChange={(_, checked) => {
                  setSaveModConfig((config) =>
                    produce(config, (config) => {
                      config.lockedPhysicalStats[
                        stat as PhysicalStatistic
                      ].locked = checked;
                    }),
                  );
                }}
              />

              <TextField
                disabled={!it.locked}
                size="small"
                type="number"
                slotProps={{
                  htmlInput: {
                    step: 1,
                  },
                }}
                value={it.value}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) : 0;
                  setSaveModConfig((config) =>
                    produce(config, (config) => {
                      config.lockedPhysicalStats[
                        stat as PhysicalStatistic
                      ].value = value;
                    }),
                  );
                }}
              />
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
