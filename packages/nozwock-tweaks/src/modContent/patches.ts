import {
  ConditionalLink,
  CraftingCondition,
  Crop,
  ExplorationLink,
  IntimateTechnique,
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
import {
  getPartyFollowDuration,
  isRealmReached,
  stripFirstPrefix,
} from 'common/utils';
import { produce } from 'immer';
import cloneDeep from 'lodash.clonedeep';
import {
  CraftingConditionModifier,
  modConfig,
  QiDropletRecover,
} from './config';

const initialGameData = {
  locationLinks: Object.entries(window.modAPI.gameData.locations).reduce(
    (acc, [key, location]) => {
      acc[key] = location.unlocks.reduce(
        (acc, it) => {
          acc[it.location.name] = cloneDeep(it);
          return acc;
        },
        {} as Record<string, ConditionalLink | ExplorationLink | undefined>,
      );
      return acc;
    },
    {} as Record<
      string,
      Record<string, ConditionalLink | ExplorationLink | undefined> | undefined
    >,
  ),
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
  mapTravelDistanceMultiplier: definePatch({
    name: 'mapTravelDistanceMultiplier',
    repeatable: true,
    onEnable() {
      this._applyMultiplier(
        modConfig.value.mapTravelDistanceMultiplier.multiplier,
      );
    },
    _applyMultiplier(multiplier: number) {
      Object.entries(window.modAPI.gameData.locations).forEach(
        ([key, locations]) => {
          locations.unlocks.forEach((it) => {
            const initialLocationLink =
              initialGameData.locationLinks[key]?.[it.location.name];
            if (initialLocationLink) {
              it.distance = Math.floor(
                multiplier * initialLocationLink.distance,
              );
            }
          });
        },
      );
    },
  }),
  herbFieldGrowthDaysMultiplier: definePatch({
    name: 'herbFieldGrowthDaysMultiplier',
    repeatable: true,
    onEnable() {
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
    repeatable: true,
    onEnable() {
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
  itemPreventConsumption: definePatch({
    name: 'itemPreventConsumption',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.itemPreventConsumption.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.itemPreventConsumption.enabled = true;
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
                modConfig.value.itemPreventConsumption.names.has(
                  payloadItem.name,
                ) ||
                modConfig.value.itemPreventConsumption.kinds.has(
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
        it.itemPreventConsumption.enabled = false;
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
  craftingAutoComplete: definePatch({
    name: 'craftingAutoComplete',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.craftingAutoComplete.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.craftingAutoComplete.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'crafting/initCrafting') {
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
        it.craftingAutoComplete.enabled = false;
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
              action === 'crafting/initCrafting' ||
              action === 'crafting/executeTechnique'
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
              action === 'crafting/executeTechnique' &&
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
  dualCultivationAutoComplete: definePatch({
    name: 'dualCultivationAutoComplete',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.dualCultivationAutoComplete.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.dualCultivationAutoComplete.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'dualCultivation/initDualCultivation') {
              return produce(state, (state) => {
                if (
                  !state.dualCultivation.progressState ||
                  !state.dualCultivation.partner
                ) {
                  console.warn('Cannot auto-complete dualCultivation');
                  return;
                }

                state.dualCultivation.progressState.satisfaction =
                  state.dualCultivation.partner.stats.satisfaction;
                state.dualCultivation.progressState.completionState = 'success';
              });
            }

            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.dualCultivationAutoComplete.enabled = false;
      });
    },
  }),
  dualCultivationInfiniteEnergy: definePatch({
    name: 'dualCultivationInfiniteEnergy',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.dualCultivationInfiniteEnergy.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.dualCultivationInfiniteEnergy.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxActionPayload((action, payload) => {
            if (action === 'dualCultivation/executeTechnique') {
              return {
                ...(payload as IntimateTechnique),
                energyCost: 0,
              } satisfies IntimateTechnique;
            }
            return payload;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.dualCultivationInfiniteEnergy.enabled = false;
      });
    },
  }),
  stoneCuttingInfiniteQiSense: definePatch({
    name: 'stoneCuttingInfiniteQiSense',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.stoneCuttingInfiniteQiSense.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.stoneCuttingInfiniteQiSense.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxActionPayload((action, payload) => {
            if (action === 'stoneCutting/spendStonePower') {
              return 0;
            }
            return payload;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.stoneCuttingInfiniteQiSense.enabled = false;
      });
    },
  }),
  stoneCuttingNoAbilityCooldown: definePatch({
    name: 'stoneCuttingNoAbilityCooldown',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.stoneCuttingNoAbilityCooldown.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.stoneCuttingNoAbilityCooldown.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'stoneCutting/unveilStone') {
              return produce(state, (state) => {
                state.stoneCutting.canUseAbility = true;
              });
            }
            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.stoneCuttingNoAbilityCooldown.enabled = false;
      });
    },
  }),
  stoneCuttingUnveilAllOnStart: definePatch({
    name: 'stoneCuttingUnveilAllOnStart',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.stoneCuttingUnveilAllOnStart.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.stoneCuttingUnveilAllOnStart.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'stoneCutting/updateStoneCutting') {
              return produce(state, (state) => {
                state.stoneCutting.uncutStones.forEach((it) => {
                  it.isUnveiled = true;
                });
              });
            }
            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.stoneCuttingUnveilAllOnStart.enabled = false;
      });
    },
  }),
  npcNoActionCooldown: definePatch({
    name: 'npcNoActionCooldown',
    unsubscribers: [],
    isEnabled() {
      return Object.values(modConfig.value.npcNoActionCooldown).includes(true);
    },
    onEnable() {
      // There's "characters/setDualCultivationCooldown" ({ character: string, cooldown: number }) but since we're
      // already having to hook on "characters/updateCharacters" for resetting follow cooldown, might as well...
      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'characters/updateCharacters') {
              return produce(state, (state) => {
                for (const character of Object.values(
                  state.characters.characterData,
                )) {
                  if (modConfig.value.npcNoActionCooldown.aidBreakthrough)
                    character.aidBreakthroughCooldown = 0;
                  if (modConfig.value.npcNoActionCooldown.dualCultivation)
                    character.dualCultivationCooldown = 0;
                  if (modConfig.value.npcNoActionCooldown.partyFollow)
                    character.followCooldown = 0;
                }
              });
            }

            return state;
          }),
        ],
      );
    },
  }),
  npcInfinitePartyFollowDuration: definePatch({
    name: 'npcInfinitePartyFollowDuration',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.npcInfinitePartyFollowDuration.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.npcInfinitePartyFollowDuration.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onGameLoad(this._maxFollowDuration),
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action === 'characters/updateCharacters') {
              return this._maxFollowDuration(state);
            }
            return state;
          }),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.npcInfinitePartyFollowDuration.enabled = false;
      });
    },
    _maxFollowDuration(state: RootState): RootState {
      return produce(state, (state) => {
        // If the NPC leave party event has already started on entering next month with followingRemainingMonths of 1,
        // we can't really do anything.
        //
        // XXX This could be mitigated by updating game state to have max follow duration on enabling the patch (from
        // settings). That way there will never be followingRemainingMonths with value of 1 since on load value is
        // already covered via the onGameLoad hook.
        if (
          state.characters.followingCharacter !== undefined &&
          state.characters.followingRemainingMonths !== undefined
        ) {
          state.characters.followingRemainingMonths =
            getPartyFollowDuration(
              state.characters.followingCharacter,
              state,
            ) ?? state.characters.followingRemainingMonths;
        }
        if (state.characters.additionalFollowingCharacters !== undefined) {
          for (const it of state.characters.additionalFollowingCharacters) {
            it.remainingMonths =
              getPartyFollowDuration(it.character, state) ?? it.remainingMonths;
          }
        }
      });
    },
  }),
  combatRecoverQiDroplets: definePatch({
    name: 'combatRecoverQiDroplets',
    unsubscribers: [],
    isEnabled() {
      return (
        modConfig.value.combatRecoverQiDroplets.current !==
        QiDropletRecover.None
      );
    },
    onEnable() {
      let beforeCombatQiDroplets: number | undefined;
      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onBeforeCombat((enemies, playerState) => {
            if (
              modConfig.value.combatRecoverQiDroplets.current ===
              QiDropletRecover.MaxDroplet
            ) {
              // Start battle with max Qi Droplets as well
              return {
                enemies,
                playerState: {
                  ...playerState,
                  stats: {
                    ...playerState.stats,
                    qiDroplets:
                      playerState.maxqiDroplets ?? playerState.stats.qiDroplets,
                  },
                },
              };
            }
            return { enemies, playerState };
          }),
          // This won't show in the combat success UI's "Qi Droplets Regenerated +X"
          window.modAPI.hooks.onReduxAction((action, _, state) => {
            if (action === 'combat/initCombat') {
              beforeCombatQiDroplets = state.player.player.qiDroplets;
              // NOTE: `window.modAPI.combat` is inconsistent in `combat/initCombat`, *sometimes* it's undefined
              //
              // Updating `state.combat.player` or `state.player.player` here seems to have no effect as state by this
              // point is stored separately in the combat component
            } else if (action === 'combat/cleanupCombat') {
              const mode = modConfig.value.combatRecoverQiDroplets.current;
              switch (mode) {
                case QiDropletRecover.MaxDroplet:
                  return produce(state, (state) => {
                    state.player.player.qiDroplets =
                      window.modAPI.utils.getMaxQiDroplets(
                        state.player.player,
                        state.breakthrough,
                      );
                  });
                case QiDropletRecover.AllUsedDroplet:
                  if (beforeCombatQiDroplets !== undefined) {
                    return produce(state, (state) => {
                      state.player.player.qiDroplets = beforeCombatQiDroplets;
                      beforeCombatQiDroplets = undefined;
                    });
                  }
                case QiDropletRecover.None:
                  console.warn(
                    `Patch ${this.name} is enabled while QiDropletRecover.None is set`,
                  );
                  break;
                default:
                  mode satisfies never;
                  break;
              }
            }

            return state;
          }),
        ],
      );
    },
  }),
  equipmentUpgradePreservesQualityTier: definePatch({
    name: 'equipmentUpgradePreservesQualityTier',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.equipmentUpgradePreservesQualityTier.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.equipmentUpgradePreservesQualityTier.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onDeriveEquipmentUpgradeRequirement(
            (baseItem, costItems, resultItem, _flags) => {
              const decreasedQuality =
                (baseItem.harmonyAugment?.quality ?? 0) -
                resultItem.resultQualityTier;
              let qualityTier = resultItem.resultQualityTier;
              let hiddenPotential = resultItem.resultHiddenPotential ?? 0;
              if (decreasedQuality > 0) {
                qualityTier += decreasedQuality;
                hiddenPotential -= decreasedQuality;
              }

              return {
                costItems,
                resultItem: {
                  ...resultItem,
                  resultQualityTier: qualityTier,
                  resultHiddenPotential: hiddenPotential,
                },
              };
            },
          ),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.equipmentUpgradePreservesQualityTier.enabled = false;
      });
    },
  }),
  // TODO: Upgrade enchantment quality on reforging equipment
  equipmentReforgeMaxQualityTier: definePatch({
    name: 'equipmentReforgeMaxQualityTier',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.equipmentReforgeMaxQualityTier.enabled;
    },
    onEnable() {
      modConfig.setValue((it) => {
        it.equipmentReforgeMaxQualityTier.enabled = true;
      });

      this.unsubscribers.push(
        ...[
          window.modAPI.hooks.onDeriveEquipmentReforgeRequirement(
            (_baseItem, costItems, resultItem, _flags) => {
              // XXX Optionally increase material cost
              return {
                costItems,
                resultItem: {
                  ...resultItem,
                  resultQualityTier:
                    resultItem.resultQualityTier +
                    (resultItem.resultHiddenPotential ?? 0),
                  resultHiddenPotential: 0,
                },
              };
            },
          ),
        ],
      );
    },
    onDisable() {
      modConfig.setValue((it) => {
        it.equipmentReforgeMaxQualityTier.enabled = false;
      });
    },
  }),
};
