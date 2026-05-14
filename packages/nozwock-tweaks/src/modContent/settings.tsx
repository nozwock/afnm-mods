import {
  Autocomplete,
  Box,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { itemKinds, itemKindToName, ModOptionsFC } from 'afnm-types';
import { removeSettingsDialogPadding } from 'common/hacks';
import { NumericMultiplierField } from 'common/ui/components';
import { getItemDisplayNames } from 'common/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CraftingConditionModifier, ModConfig, modConfig } from './config';
import { patches, patchManager } from './patches';

const t = window.modAPI.utils.t;

export const ModSettings: ModOptionsFC = ({ api }) => {
  const [config, setConfig] = useState(() => modConfig.value);
  const [itemNames, itemDisplayNames] = useMemo(() => {
    const itemNameToDisplay = getItemDisplayNames();
    return [Object.keys(itemNameToDisplay), itemNameToDisplay];
  }, []);
  const displayCraftingConditionModifier: Record<
    CraftingConditionModifier,
    string
  > = useMemo(
    () => ({
      [CraftingConditionModifier.AlwaysHarmonious]: t('Always Harmonious'),
      [CraftingConditionModifier.AtleastNeutral]: t('At least Neutral'),
      [CraftingConditionModifier.InvertNegative]: t('Invert Negative'),
      [CraftingConditionModifier.None]: t('None'),
    }),
    [],
  );
  const selectedItemConsumptionNames = useMemo(
    () => Array.from(config.preventItemConsumption.names),
    [config.preventItemConsumption.names],
  );
  const selectedItemConsumptionKinds = useMemo(
    () => Array.from(config.preventItemConsumption.kinds),
    [config.preventItemConsumption.kinds],
  );

  function setModConfig(updater: (config: ModConfig) => ModConfig) {
    modConfig.value = updater(modConfig.value);
    setConfig(modConfig.value);
  }

  const thisRef = useRef<Node>(null);
  useEffect(() => {
    removeSettingsDialogPadding(thisRef);
  }, []);

  return (
    <Box
      ref={thisRef}
      display="flex"
      flexDirection="column"
      gap={2}
      marginX={3}
      marginY={5}
    >
      <Typography fontSize="200%">{t('General')}</Typography>
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

      <NumericMultiplierField
        label={t('Herb Field Growth Days Multiplier')}
        value={config.herbFieldGrowthDaysMultiplier.multiplier}
        onChange={(value) => {
          setModConfig((it) => ({
            ...it,
            herbFieldGrowthDaysMultiplier: {
              ...it.herbFieldGrowthDaysMultiplier,
              multiplier: value,
            },
          }));
          patches.herbFieldGrowthDaysMultiplier._applyMultiplier(value);
        }}
      ></NumericMultiplierField>

      <NumericMultiplierField
        label={t('Room Blueprint Build Time Multiplier')}
        value={config.roomBlueprintBuildTimeMultiplier.multiplier}
        onChange={(value) => {
          setModConfig((it) => ({
            ...it,
            roomBlueprintBuildTimeMultiplier: {
              ...it.roomBlueprintBuildTimeMultiplier,
              multiplier: value,
            },
          }));
          patches.roomBlueprintBuildTimeMultiplier._applyMultiplier(value);
        }}
      ></NumericMultiplierField>

      <Typography fontSize="200%">{t('Items')}</Typography>
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
          options={itemNames}
          getOptionLabel={(name) => itemDisplayNames[name] ?? name}
          value={selectedItemConsumptionNames}
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
          value={selectedItemConsumptionKinds}
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

      <Typography fontSize="200%">{t('Crafting')}</Typography>
      <FormGroup>
        <FormControlLabel
          label={t('Auto Complete Crafting')}
          control={
            <Checkbox
              checked={config.autoCompleteCrafting.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(patches.autoCompleteCrafting, value);
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t('Prevent Max Stability Degradation')}
          control={
            <Checkbox
              checked={config.craftingNoMaxStabilityDegradation.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(
                  patches.craftingNoMaxStabilityDegradation,
                  value,
                );
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
      </FormGroup>

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography>{t('Crafting Condition Modifier')}</Typography>
        <Select
          size="small"
          sx={{
            minWidth: '120px',
          }}
          value={config.craftingConditionModifier.current}
          onChange={(e) => {
            patchManager.setEnabled(
              patches.craftingConditionModifier,
              e.target.value !== CraftingConditionModifier.None,
            );
            setModConfig((it) => ({
              ...it,
              craftingConditionModifier: {
                ...it.craftingConditionModifier,
                current: e.target.value,
              },
            }));
          }}
        >
          {Object.entries(displayCraftingConditionModifier).map(
            ([key, value]) => (
              <MenuItem value={Number(key)}>{value}</MenuItem>
            ),
          )}
        </Select>
      </Stack>

      <Typography fontSize="200%">{t('Dual Cultivation')}</Typography>
      <FormGroup>
        <FormControlLabel
          label={t('Auto Complete Dual Cultivation')}
          control={
            <Checkbox
              checked={config.dualCultivationAutoComplete.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(
                  patches.dualCultivationAutoComplete,
                  value,
                );
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
        <FormControlLabel
          label={t('Infinite Energy')}
          control={
            <Checkbox
              checked={config.dualCultivationInfiniteEnergy.enabled}
              onChange={(_, value) => {
                patchManager.setEnabled(
                  patches.dualCultivationInfiniteEnergy,
                  value,
                );
                setConfig(modConfig.value);
              }}
            />
          }
        ></FormControlLabel>
      </FormGroup>
    </Box>
  );
};
