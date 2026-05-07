import { singleton } from 'common/decorators';
import { revertChangedItems } from 'common/utils';
import { MOD_ID } from './const';

type Constructor<T> = new (...args: any[]) => T;

export interface Feature {
  initialize(): void;
  enable(): void;
  disable(): void;
}

export interface ConfigurableFeature<T = unknown> extends Feature {
  get config(): Readonly<T>;
  set config(data: T);
  resetConfig(): void;
}

export class FeatureManager {
  private constructor() {}

  private static features = new Map<
    Constructor<Feature | ConfigurableFeature>,
    Feature | ConfigurableFeature
  >();

  public static register(ctor: Constructor<Feature | ConfigurableFeature>) {
    // Don't access members via `this` since this function is being used as a decorator, and the function bound object
    // seems to no longer be the class then for some reason.
    if (FeatureManager.get(ctor) === undefined)
      FeatureManager.features.set(ctor, new ctor());
  }

  public static get<T extends Feature | ConfigurableFeature>(
    ctor: Constructor<T>,
  ): T | undefined {
    return FeatureManager.features.get(ctor) as T | undefined;
  }

  public static getAll(): (Feature | ConfigurableFeature)[] {
    return [...FeatureManager.features.values()];
  }
}

export namespace Feature {
  abstract class BaseConfigurableFeature<Config extends { enabled?: boolean }>
    implements Feature, ConfigurableFeature<Config>
  {
    protected abstract configKey: string;
    protected abstract defaultConfig: Config;

    private _cachedConfig?: Config = undefined;
    private _isEnabled = false;

    // XXX Could also have a separate Config/Setting class that'd act as a proxy to localStorage, only updating
    // properties that are changed on write/set similar to redux store.
    get config(): Readonly<Config> {
      if (this._cachedConfig) {
        return this._cachedConfig;
      }

      const item = localStorage.getItem(this.configKey);
      this._cachedConfig = item
        ? (JSON.parse(item) as Config)
        : { ...this.defaultConfig };
      return this._cachedConfig;
    }

    set config(data: Config) {
      // Would've liked to have TS enforce the passed data as immutable (to avoid runtime clone), so it can't be mutated
      // after the value has been passed to the function, but this is not a thing currently.
      // https://github.com/microsoft/TypeScript/issues/14909
      this._cachedConfig = structuredClone(data);
      localStorage.setItem(this.configKey, JSON.stringify(this._cachedConfig));
      this.onConfigChange();
    }

    resetConfig(): void {
      this._cachedConfig = undefined;
      localStorage.removeItem(this.configKey);
    }

    initialize(): void {
      if (this.config.enabled) {
        this.enable();
      }
    }

    enable(): void {
      if (this._isEnabled) return;
      this._isEnabled = true;
      this.config = { ...this.config, enabled: true };
      console.info(`Enabled ${this.configKey}`);
      this.onEnable();
    }

    disable(): void {
      if (!this._isEnabled) return;
      this._isEnabled = false;
      this.config = { ...this.config, enabled: false };
      console.info(`Disabled ${this.configKey}`);
      this.onDisable();
    }

    protected abstract onConfigChange(): void;
    protected abstract onEnable(): void;
    protected abstract onDisable(): void;
  }

  // IMPORTANT: singleton needs to be the last otherwise the constructor that is exported and one that'll be stored via
  // register will be different
  @FeatureManager.register
  @singleton
  export class PreventItemConsumption extends BaseConfigurableFeature<{
    enabled: boolean;
  }> {
    private hooksRegistered: boolean = false;

    protected configKey: string = `${MOD_ID}.PreventItemConsumption`;
    protected defaultConfig = {
      enabled: true,
    };

    protected onConfigChange(): void {}

    protected onEnable(): void {
      if (!this.hooksRegistered) {
        window.modAPI.hooks.onReduxAction((action, prevState, state) => {
          if (this.config.enabled && action == 'inventory/removeItem') {
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
        });
      }

      this.hooksRegistered = true;
    }

    protected onDisable(): void {}
  }
}
