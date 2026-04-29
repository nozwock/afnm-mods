import { Box, Slider, Typography } from '@mui/material';
import { useState } from 'react';
import { MOD_ID } from './const';
import { QuickSaves } from './quicksaves';

const t = window.modAPI.utils.t;
const keyMaxQuicksaves = `${MOD_ID}.maxQuicksaves`;

window.modAPI.actions.registerOptionsUI(({ api }) => {
  // NOTE: Use localstorage for complex persistent data not tied to save files
  QuickSaves.slotCapacity =
    window.modAPI.actions.getGlobalFlags()[keyMaxQuicksaves] ?? 3;

  const [quicksaveSlots, setQuicksaveSlots] = useState({
    value: QuickSaves.slotCapacity,
  });

  return (
    <Box marginTop="40px">
      <Typography fontSize="120%">
        {t('Max Quicksaves: {slots}', { slots: quicksaveSlots.value })}
      </Typography>
      <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
        {t(
          'Quickload uses only the most recent quicksave. The others serve as backups.',
        )}
      </Typography>
      <Slider
        value={quicksaveSlots.value}
        onChange={(_, value) => {
          QuickSaves.slotCapacity = value;
          window.modAPI.actions.setGlobalFlag(keyMaxQuicksaves, value);
          setQuicksaveSlots((it) => ({
            ...it,
            value: value,
          }));
        }}
        step={1}
        marks
        min={1}
        max={20}
      ></Slider>
    </Box>
  );
});
