import { ItemKind } from 'afnm-types';
import { GlobalConfig } from 'common/config';
import { MOD_ID } from './const';

export const defaultModConfig = {
  roomBlueprintBuildTimeMultiplier: {
    multiplier: 0,
  },
  preventItemConsumption: {
    enabled: true,
    names: new Set(['Jade Visage Pill']),
    kinds: new Set<ItemKind>(['blueprint', 'transport_seal']),
  },
  maxRarityAddedEnchantments: {
    enabled: false,
  },
  maxRarityTechniqueMastery: {
    enabled: false,
  },
};

export type ModConfig = typeof defaultModConfig;
export const modConfig = new GlobalConfig(`${MOD_ID}.config`, defaultModConfig);
