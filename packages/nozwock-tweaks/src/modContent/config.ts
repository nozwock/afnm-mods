import { ItemKind } from 'afnm-types';
import { GlobalConfig } from 'common/config';
import { MOD_ID } from './const';

export enum CraftingConditionModifier {
  None,
  AlwaysHarmonious,
  InvertNegative,
  AtleastNeutral,
}

export enum QiDropletRecover {
  None,
  AllUsedDroplet,
  MaxDroplet,
}

interface ModConfigV1 {
  configVersion: number;
  mapTravelDistanceMultiplier: {
    multiplier: number;
  };
  herbFieldGrowthDaysMultiplier: {
    multiplier: number;
  };
  roomBlueprintBuildTimeMultiplier: {
    multiplier: number;
  };
  itemPreventConsumption: {
    enabled: boolean;
    names: Set<string>;
    kinds: Set<ItemKind>;
  };
  maxRarityAddedEnchantments: {
    enabled: boolean;
  };
  maxRarityTechniqueMastery: {
    enabled: boolean;
  };
  craftingAutoComplete: {
    enabled: boolean;
  };
  craftingConditionModifier: {
    current: CraftingConditionModifier;
  };
  craftingNoMaxStabilityDegradation: {
    enabled: boolean;
  };
  dualCultivationAutoComplete: {
    enabled: boolean;
  };
  dualCultivationInfiniteEnergy: {
    enabled: boolean;
  };
  stoneCuttingInfiniteQiSense: {
    enabled: boolean;
  };
  stoneCuttingNoAbilityCooldown: {
    enabled: boolean;
  };
  stoneCuttingUnveilAllOnStart: {
    enabled: boolean;
  };
  npcNoActionCooldown: {
    dualCultivation: boolean;
    aidBreakthrough: boolean;
    partyFollow: boolean;
  };
  npcInfinitePartyFollowDuration: {
    enabled: boolean;
  };
  combatRestoreAllUsedQiDroplets: {
    enabled: boolean;
  };
  equipmentUpgradePreservesQualityTier: {
    enabled: boolean;
  };
  equipmentReforgeMaxQualityTier: {
    enabled: boolean;
  };
}

type ModConfigV2 = Omit<ModConfigV1, 'combatRestoreAllUsedQiDroplets'> & {
  combatRecoverQiDroplets: {
    current: QiDropletRecover;
  };
};

export type ModConfig = ModConfigV2;

export const defaultModConfig: ModConfig = {
  configVersion: 2,
  mapTravelDistanceMultiplier: {
    multiplier: 1,
  },
  herbFieldGrowthDaysMultiplier: {
    multiplier: 1,
  },
  roomBlueprintBuildTimeMultiplier: {
    multiplier: 0,
  },
  itemPreventConsumption: {
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
  craftingAutoComplete: {
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
  npcNoActionCooldown: {
    dualCultivation: false,
    aidBreakthrough: true,
    partyFollow: true,
  },
  npcInfinitePartyFollowDuration: {
    enabled: false,
  },
  combatRecoverQiDroplets: {
    current: QiDropletRecover.None,
  },
  equipmentUpgradePreservesQualityTier: {
    enabled: true,
  },
  equipmentReforgeMaxQualityTier: {
    enabled: false,
  },
};

export const modConfig = new GlobalConfig(
  `${MOD_ID}.config`,
  defaultModConfig,
  (config) => {
    if (config.configVersion === 1) {
      config.configVersion = 2;
      config.combatRecoverQiDroplets.current =
        (config as unknown as ModConfigV1).combatRestoreAllUsedQiDroplets
          ?.enabled === true
          ? QiDropletRecover.AllUsedDroplet
          : config.combatRecoverQiDroplets.current;
    }

    return config;
  },
);
