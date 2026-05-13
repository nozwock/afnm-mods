import {
  Item,
  KnownCraftingTechniqueMastery,
  KnownTechnique,
  Rarity,
  rarityToNameOnly,
  Room,
  RootState,
} from 'afnm-types';
import { definePatch, PatchManager } from 'common/patch';
import { isRealmReached, stripFirstPrefix } from 'common/utils';
import cloneDeep from 'lodash.clonedeep';
import { modConfig } from './config';

const initialGameData = {
  rooms: window.modAPI.gameData.rooms.reduce(
    (acc, it) => {
      acc[it.name] = cloneDeep(it);
      return acc;
    },
    {} as Record<string, Room>,
  ),
};

export const patchManager = new PatchManager();
export const patches = {
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
        const initialBuildMonths = initialGameData.rooms[room.name].buildMonths;
        room.buildMonths = Math.floor(multiplier * initialBuildMonths);
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
};
