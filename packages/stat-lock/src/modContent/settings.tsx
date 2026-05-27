import { Box, Stack, Switch, TextField, Typography } from '@mui/material';
import { ModOptionsFC, PhysicalStatistic, statToName } from 'afnm-types';
import { produce } from 'immer';
import { useEffect, useState } from 'react';
import { ModConfig, modConfig } from './config';
import { patches, patchManager } from './patches';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const [config, setConfig] = useState(() => modConfig.value);

  function setModConfig(updater: (config: ModConfig) => ModConfig) {
    modConfig.value = updater(modConfig.value);
    setConfig(modConfig.value);
  }

  useEffect(
    () =>
      function onUnmount() {
        const state = window.modAPI.getGameStateSnapshot()!;
        const updatedPlayer = produce(state.player.player, (player) => {
          patches.lockPhysicalStats._tryLockStats(player);
        });
        if (state.player.player !== updatedPlayer) {
          api.actions.updatePlayer(updatedPlayer);
        }
      },
    [],
  );

  const GameButton = api.components.GameButton;

  return (
    <Box display="flex" flexDirection="column" gap={2} marginY={5}>
      <Stack direction="row">
        <Typography fontSize="200%">{t('Stat Lock')}</Typography>
        <GameButton
          sx={{ ml: 'auto' }}
          size="small"
          onClick={() => {
            modConfig.reset();
            setConfig(modConfig.value);
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
        <Typography fontSize="200%">{t('Physical Stats')}</Typography>
        <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
          {t('Lock stats to specific values individually.')}
        </Typography>
      </Stack>

      <Stack direction="column" spacing={1}>
        {Object.entries(config.lockedPhysicalStats).map(([stat, it]) => (
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
                  setModConfig((config) =>
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
                  setModConfig((config) =>
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
