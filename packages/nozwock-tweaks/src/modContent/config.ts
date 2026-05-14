import { ItemKind } from 'afnm-types';
import { GlobalConfig } from 'common/config';
import { MOD_ID } from './const';

export enum CraftingConditionModifier {
  None,
  AlwaysHarmonious,
  InvertNegative,
  AtleastNeutral,
}

export const defaultModConfig = {
  mapTravelDistanceMultiplier: {
    multiplier: 1,
  },
  herbFieldGrowthDaysMultiplier: {
    multiplier: 1,
  },
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
  autoCompleteCrafting: {
    enabled: false,
  },
  craftingConditionModifier: {
    current: CraftingConditionModifier.None,
  },
  craftingNoMaxStabilityDegradation: {
    enabled: false,
  },
  dualCultivationAutoComplete: {
    enabled: false,
  },
  dualCultivationInfiniteEnergy: {
    enabled: false,
  },
  stoneCuttingInfiniteQiSense: {
    enabled: false,
  },
  stoneCuttingNoAbilityCooldown: {
    enabled: false,
  },
  stoneCuttingUnveilAllOnStart: {
    enabled: false,
  },
};

export type ModConfig = typeof defaultModConfig;
export const modConfig = new GlobalConfig(`${MOD_ID}.config`, defaultModConfig);
