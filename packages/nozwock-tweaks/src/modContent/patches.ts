import { Item, rarityToNameOnly, RootState } from 'afnm-types';
import { definePatch, PatchManager } from 'common/patch';
import { isRealmReached, stripFirstPrefix } from 'common/utils';
import { modConfig } from './config';

export const patchManager = new PatchManager();
export const patches = {
  preventItemConsumption: definePatch({
    name: 'preventItemConsumption',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.preventItemConsumption.enabled;
    },
    onEnable() {
      modConfig.value = {
        ...modConfig.value,
        preventItemConsumption: {
          ...modConfig.value.preventItemConsumption,
          enabled: true,
        },
      };

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
      modConfig.value = {
        ...modConfig.value,
        preventItemConsumption: {
          ...modConfig.value.preventItemConsumption,
          enabled: false,
        },
      };
    },
  }),
  maxRarityAddedEnchantments: definePatch({
    name: 'maxRarityAddedEnchantments',
    unsubscribers: [],
    isEnabled() {
      return modConfig.value.maxRarityAddedEnchantments.enabled;
    },
    onEnable() {
      modConfig.value = {
        ...modConfig.value,
        maxRarityAddedEnchantments: {
          ...modConfig.value.maxRarityAddedEnchantments,
          enabled: true,
        },
      };

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
      modConfig.value = {
        ...modConfig.value,
        maxRarityAddedEnchantments: {
          ...modConfig.value.maxRarityAddedEnchantments,
          enabled: false,
        },
      };
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
};
