import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material';
import { ModOptionsFC } from 'afnm-types';
import { useState } from 'react';
import { Feature } from './features';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const preventItemConsumption = new Feature.PreventItemConsumption();
  const [configPreventItemConsumption, setConfigPreventItemConsumption] =
    useState(preventItemConsumption.config);

  return (
    <Box marginTop="40px" display="flex" flexDirection="column" gap="16px">
      <Box>
        <FormGroup>
          <FormControlLabel
            label={t('Prevent Item Consumption')}
            control={
              <Checkbox
                checked={configPreventItemConsumption.enabled}
                onChange={(_, value) => {
                  if (value) {
                    preventItemConsumption.enable();
                  } else {
                    preventItemConsumption.disable();
                  }

                  setConfigPreventItemConsumption((it) => ({
                    ...it,
                    enabled: preventItemConsumption.config.enabled,
                  }));
                }}
              />
            }
          ></FormControlLabel>
        </FormGroup>
        <Typography fontSize="90%" sx={{ opacity: 0.7 }}>
          {t('Only Affects {pill}, blueprint, and transport_seal', {
            pill: t('Jade Visage Pill'),
          })}
        </Typography>
      </Box>
    </Box>
  );
};
