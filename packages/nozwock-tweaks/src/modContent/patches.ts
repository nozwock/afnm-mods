import {
  CraftingCondition,
  Crop,
  Item,
  KnownCraftingTechniqueMastery,
  KnownTechnique,
  Rarity,
  rarityToNameOnly,
  Realm,
  Room,
  RootState,
} from 'afnm-types';
import { definePatch, PatchManager } from 'common/patch';
import { isRealmReached, stripFirstPrefix } from 'common/utils';
import { produce } from 'immer';
import cloneDeep from 'lodash.clonedeep';
import { CraftingConditionModifier, modConfig } from './config';

const initialGameData = {
  crops: Object.entries(window.modAPI.gameData.crops).reduce(
    (acc, [realm, crops]) => {
      acc[realm as Realm] = crops.reduce(
        (acc, crop) => {
          acc[crop.item] = cloneDeep(crop);
          return acc;
        },
        {} as Record<string, Crop | undefined>,
      );
      return acc;
    },
    // The record is not guaranteed to have an entry for every crop in `ModAPI.gameData.crops` at any given moment since
    // there may be new entries added by mods later in the load order.
    {} as Record<Realm, Record<string, Crop | undefined> | undefined>,
  ),
  rooms: window.modAPI.gameData.rooms.reduce(
    (acc, it) => {
      acc[it.name] = cloneDeep(it);
      return acc;
    },
    {} as Record<string, Room | undefined>,
  ),
};

export const patchManager = new PatchManager();
export const patches = {
  herbFieldGrowthDaysMultiplier: definePatch({
    name: 'herbFieldGrowthDaysMultiplier',
    isEnabled() {
      return modConfig.value.herbFieldGrowthDaysMultiplier.multiplier !== 1;
    },
    onEnable: function (): void {
      this._applyMultiplier(
        modConfig.value.herbFieldGrowthDaysMultiplier.multiplier,
      );
    },
    _applyMultiplier(multiplier: number) {
      Object.entries(window.modAPI.gameData.crops).forEach(([realm, crops]) => {
        crops.forEach((crop) => {
          const initialCrop =
            initialGameData.crops[realm as Realm]?.[crop.item];
          if (initialCrop) {
            crop.growthDays = Math.floor(multiplier * initialCrop.growthDays);
          }
        });
      });
    },
  }),
  roomBlueprintBuildTimeMultiplier: definePatch({
    name: 'roomBlueprintBuildTimeMultiplier',
    isEnabled() {
      return modConfig.value.roomBlueprintBuildTimeMultiplier.multiplier !== 1;
    },
    onEnable: function (): void {
      this._applyMultiplier(
        modConfig.value.roomBlueprintBuildTimeMultiplier.multiplier,
      );
    },
    _applyMultiplier(multiplier: number) {
      window.modAPI.gameData.rooms.forEach((room) => {
        const initialRoom = initialGameData.rooms[room.name];
        if (initialRoom) {
          room.buildMonths = Math.floor(multiplier * initialRoom.buildMonths);
        }
      });
    },
  }),
  preventItemConsumption: definePatch({
    name: 'preventItemConsumption',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.preventItemConsumption.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.preventItemConsumption.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxActionPayload((action, payload) => {
            if (action === 'inventory/removeItem') {
              // Prevent certain items from being consumed.
              //
              // This'd not prevent item from being sold since selling items in market uses "inventory/removeItemBatch"
              // instead, which is great since we don't want to prevent selling.
              const payloadItem = payload as { name: string; stacks: number };
              const items = window.modAPI.gameData.items;
              if (
                modConfig.value.preventItemConsumption.names.has(
                  payloadItem.name,
                ) ||
                modConfig.value.preventItemConsumption.kinds.has(
                  items[payloadItem.name].kind,
                )
              ) {
                // Drop payload
                return null;
              }
            }
            return payload;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.preventItemConsumption.enabled = false;
      });
    },
  }),
  maxRarityAddedEnchantments: definePatch({
    name: 'maxRarityAddedEnchantments',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.maxRarityAddedEnchantments.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.maxRarityAddedEnchantments.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxActionPayload((action, payload, state) => {
            if (action === 'inventory/addItem') {
              return this._updateEnchantmentRarity([payload as Item], state)[0];
            } else if (action === 'inventory/addItemBatch') {
              return this._updateEnchantmentRarity(payload as Item[], state);
            }
            return payload;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.maxRarityAddedEnchantments.enabled = false;
      });
    },
    _updateEnchantmentRarity(payload: Item[], state: RootState): Item[] {
      const rarityName = isRealmReached(
        state.player.player.realm,
        'pillarCreation',
      )
        ? 'Transcendent'
        : 'Incandescent';
      const items = window.modAPI.gameData.items;
      return payload.map((it) => {
        if (items[it.name].kind === 'enchantment') {
          return {
            ...it,
            name: `${rarityName}${stripFirstPrefix(it.name, Object.values(rarityToNameOnly))}`,
          };
        }
        return it;
      });
    },
  }),
  maxRarityTechniqueMastery: definePatch({
    name: 'maxRarityTechniqueMastery',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.maxRarityTechniqueMastery.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.maxRarityTechniqueMastery.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxActionPayload((action, payload, state) => {
            if (action === 'player/updateTechnique') {
              const tier: Rarity = isRealmReached(
                state.player.player.realm,
                'pillarCreation',
              )
                ? 'transcendent'
                : 'incandescent';
              const techniquePayload = payload as KnownTechnique;
              return {
                ...techniquePayload,
                mastery: techniquePayload.mastery
                  ? techniquePayload.mastery.map((mastery) => {
                      return {
                        ...mastery,
                        tier: tier,
                      } as KnownCraftingTechniqueMastery;
                    })
                  : undefined,
              } satisfies KnownTechnique;
            }
            return payload;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.maxRarityTechniqueMastery.enabled = false;
      });
    },
  }),
  autoCompleteCrafting: definePatch({
    name: 'autoCompleteCrafting',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.autoCompleteCrafting.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.autoCompleteCrafting.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action == 'crafting/initCrafting') {
              return produce(state, (state) => {
                if (
                  !state.crafting.progressState ||
                  !state.crafting.recipe ||
                  !state.crafting.recipeStats
                ) {
                  console.warn('Cannot auto-complete crafting');
                  return;
                }

                state.crafting.progressState.completion =
                  window.modAPI.utils.getMaxCompletion(
                    state.crafting.recipe,
                    state.crafting.recipeStats,
                    state.player.player.realm,
                  ).flat;
                state.crafting.progressState.perfection =
                  window.modAPI.utils.getMaxPerfection(
                    state.crafting.recipe,
                    state.crafting.recipeStats,
                    state.player.player.realm,
                  ).flat;
              });
            }

            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.autoCompleteCrafting.enabled = false;
      });
    },
  }),
  craftingConditionModifier: definePatch({
    name: 'craftingConditionModifier',
    unsubscribers: [],
    isEnabled() {
      return (
        modConfig.value.craftingConditionModifier.current !==
        CraftingConditionModifier.None
      );
    },
    onEnable() {
      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (
              action == 'crafting/initCrafting' ||
              action == 'crafting/executeTechnique'
            ) {
              return produce(state, (state) => {
                if (!state.crafting.progressState) return;

                const modifier =
                  modConfig.value.craftingConditionModifier.current;
                switch (modifier) {
                  case CraftingConditionModifier.AlwaysHarmonious:
                    state.crafting.progressState.condition = 'positive';
                    state.crafting.progressState.nextConditions.fill(
                      'positive',
                    );
                    break;
                  case CraftingConditionModifier.InvertNegative:
                    state.crafting.progressState.condition =
                      this._invertNegativeCraftingCondition(
                        state.crafting.progressState.condition,
                      );
                    state.crafting.progressState.nextConditions =
                      state.crafting.progressState.nextConditions.map(
                        this._invertNegativeCraftingCondition,
                      );
                    break;
                  case CraftingConditionModifier.AtleastNeutral:
                    state.crafting.progressState.condition =
                      this._atleastNeutralCraftingCondition(
                        state.crafting.progressState.condition,
                      );
                    state.crafting.progressState.nextConditions =
                      state.crafting.progressState.nextConditions.map(
                        this._atleastNeutralCraftingCondition,
                      );
                    break;
                  case CraftingConditionModifier.None:
                    console.warn(
                      `Patch ${this.name} is enabled while CraftingConditionModifier.None is set`,
                    );
                    break;
                  default:
                    modifier satisfies never;
                }
              });
            }

            return state;
          }),
        ],
      );
    },
    _atleastNeutralCraftingCondition(
      condition: CraftingCondition,
    ): CraftingCondition {
      switch (condition) {
        case 'negative':
        case 'veryNegative':
          return 'neutral';
        default:
          return condition;
      }
    },
    _invertNegativeCraftingCondition(
      condition: CraftingCondition,
    ): CraftingCondition {
      switch (condition) {
        case 'negative':
          return 'positive';
        case 'veryNegative':
          return 'veryPositive';
        default:
          return condition;
      }
    },
  }),
  craftingNoMaxStabilityDegradation: definePatch({
    name: 'craftingNoMaxStabilityDegradation',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.craftingNoMaxStabilityDegradation.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.craftingNoMaxStabilityDegradation.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (
              action == 'crafting/executeTechnique' &&
              state.crafting.progressState
            ) {
              return produce(state, (state) => {
                state.crafting.progressState!.stabilityPenalty = 0;
              });
            }

            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.craftingNoMaxStabilityDegradation.enabled = false;
      });
    },
  }),
};
