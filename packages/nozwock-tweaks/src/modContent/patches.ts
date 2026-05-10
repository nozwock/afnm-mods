import { Patch, PatchManager } from 'common/patch';
import { ModConfig, modConfig } from './config';

export const patchManager = new PatchManager();
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
          window.modAPI.hooks.onReduxActionPayload((action, payload) => {
            if (action == 'inventory/removeItem') {
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
  },
} satisfies Record<string, Patch<ModConfig>>;
