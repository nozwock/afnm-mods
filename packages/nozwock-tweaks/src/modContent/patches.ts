import { Patch, PatchManager } from 'common/patch';
import { revertChangedItems } from 'common/utils';
import { ModConfig, modConfig } from './config';

export const patchManager = new PatchManager(() => modConfig.value);
export const patches = {
  preventItemConsumption: {
    name: 'preventItemConsumption',
    unsubscribers: [],
    isEnabled(config) {
      return config.preventItemConsumption.enabled;
    },
    onEnable: function (): void {
      modConfig.value = {
        ...modConfig.value,
        preventItemConsumption: {
          ...modConfig.value.preventItemConsumption,
          enabled: true,
        },
      };

      this.unsubscribers!.push(
        ...[
          window.modAPI.hooks.onReduxAction((action, prevState, state) => {
            if (action == 'inventory/removeItem') {
              // Prevent certain items from being consumed.
              //
              // This'd not prevent item from being sold since selling items in market uses "inventory/removeItemBatch"
              // instead, which is great since we don't want to prevent selling.
              const items = window.modAPI.gameData.items;
              return {
                ...state,
                inventory: {
                  ...state.inventory,
                  items: revertChangedItems(
                    state.inventory,
                    prevState.inventory,
                    (item) =>
                      item.name === 'Jade Visage Pill' ||
                      items[item.name].kind === 'blueprint' ||
                      items[item.name].kind === 'transport_seal',
                  ),
                },
              };
            }

            return state;
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
  },
} satisfies Record<string, Patch<ModConfig>>;
