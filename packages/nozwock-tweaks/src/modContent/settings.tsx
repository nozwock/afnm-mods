import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material';
import { ModOptionsFC } from 'afnm-types';
import { useState } from 'react';
import { modConfig } from './config';
import { patchManager, patches } from './patches';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const [config, setConfig] = useState(() => modConfig.value);

  return (
    <Box marginTop="40px" display="flex" flexDirection="column" gap="16px">
      <Box>
        <FormGroup>
          <FormControlLabel
            label={t('Prevent Item Consumption')}
            control={
              <Checkbox
                checked={config.preventItemConsumption.enabled}
                onChange={(_, value) => {
                  if (value) {
                    patchManager.enable(patches.preventItemConsumption);
                  } else {
                    patchManager.disable(patches.preventItemConsumption);
                  }

                  setConfig((it) => ({
                    ...it,
                    preventItemConsumption: {
                      ...it.preventItemConsumption,
                      enabled: value,
                    },
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
