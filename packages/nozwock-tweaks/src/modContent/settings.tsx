import {
  Autocomplete,
  Box,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Switch,
  TextField,
} from '@mui/material';
import { itemKinds, itemKindToName, ModOptionsFC } from 'afnm-types';
import { getItemDisplayNames } from 'common/utils';
import { useMemo, useState } from 'react';
import { ModConfig, modConfig } from './config';
import { patches, patchManager } from './patches';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const [config, setConfig] = useState(() => modConfig.value);
  const itemDisplayNames = useMemo(getItemDisplayNames, []);

  function setModConfig(updater: (config: ModConfig) => ModConfig) {
    modConfig.value = updater(modConfig.value);
    setConfig(modConfig.value);
  }

  return (
    <Box marginTop="40px" display="flex" flexDirection="column" gap={2}>
      <FormGroup>
        <FormControlLabel
          label={t('Max Out Technique Masteries on Attempt')}
          control={
            <Checkbox
              checked={config.maxRarityTechniqueMastery.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(
                  patches.maxRarityTechniqueMastery,
                  value,
                );
                // The patch is expected to update modConfig's enabled value
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t("Max Out Added Enchantments' Rarity")}
          control={
            <Checkbox
              checked={config.maxRarityAddedEnchantments.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(
                  patches.maxRarityAddedEnchantments,
                  value,
                );
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
      </FormGroup>
      <Card
        elevation={2}
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={config.preventItemConsumption.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(patches.preventItemConsumption, value);
                setConfig(modConfig.value);
              }}
            />
          }
          label={t('Prevent Item Consumption')}
        />

        <Autocomplete
          multiple
          options={Object.keys(itemDisplayNames)}
          getOptionLabel={(name) => itemDisplayNames[name] ?? name}
          value={Array.from(config.preventItemConsumption.names)}
          onChange={(_, values) => {
            setModConfig((it) => ({
              ...it,
              preventItemConsumption: {
                ...it.preventItemConsumption,
                names: new Set(values),
              },
            }));
          }}
          renderValue={(values, getTagProps) =>
            values.map((name, index) => (
              <Chip
                {...getTagProps({ index })}
                key={name}
                label={itemDisplayNames[name] ?? name}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label={t('Item Names')}
              placeholder={t('Select or type item names')}
            />
          )}
          freeSolo
        />

        <Autocomplete
          multiple
          options={itemKinds}
          getOptionLabel={(kind) => t(itemKindToName[kind] ?? kind)}
          value={Array.from(config.preventItemConsumption.kinds)}
          onChange={(_, values) => {
            setModConfig((it) => ({
              ...it,
              preventItemConsumption: {
                ...it.preventItemConsumption,
                kinds: new Set(values),
              },
            }));
          }}
          renderValue={(values, getTagProps) =>
            values.map((kind, index) => (
              <Chip
                {...getTagProps({ index })}
                key={kind}
                label={t(itemKindToName[kind] ?? kind)}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label={t('Item Kinds')}
              placeholder={t('Select item kinds')}
            />
          )}
        />
      </Card>
    </Box>
  );
};
