import { ModReduxAPI, RootState } from 'afnm-types';
import { Draft, produce } from 'immer';
import merge from 'lodash.merge';
import { useMemo } from 'react';
import { deepFreeze } from './utils';

export function useSaveModData<T>(
  api: ModReduxAPI,
  modId: string,
  key: string,
): T | undefined;
export function useSaveModData<T>(
  api: ModReduxAPI,
  modId: string,
  key: string,
  getDefaultValue: () => Readonly<T>,
): T;
export function useSaveModData<T>(
  api: ModReduxAPI,
  modId: string,
  key: string,
  getDefaultValue?: () => Readonly<T>,
): T | undefined {
  const defaultValue = useMemo(
    () => (getDefaultValue !== undefined ? getDefaultValue() : undefined),
    [],
  );

  const saveModData = api.hasSave
    ? api.useSelector(
        (state) => getSaveModData<T>(modId, key, state) ?? defaultValue,
      )
    : defaultValue;

  return saveModData;
}

/**
 * Use `ModReduxAPI.actions.setModData` for setting data instead.
 */
export function getSaveModData<T>(
  modId: string,
  key: string,
  state: Readonly<RootState> | undefined = undefined,
): T | undefined {
  state ??= window.modAPI.getGameStateSnapshot()!;
  return state.mod.data[modId]?.[key] as T | undefined;
}

export class GlobalConfig<Config extends object> {
  private configKey: string;
  private defaultConfig: Readonly<Config>;
  private _cachedConfig?: Readonly<Config> = undefined;
  private migrate?: (config: Config) => Config;

  constructor(
    key: string,
    defaultValue: Config,
    migrate?: typeof this.migrate,
  ) {
    this.configKey = key;
    this.defaultConfig = structuredClone(defaultValue);
    this.migrate = migrate;
  }

  public get value(): Readonly<Config> {
    if (this._cachedConfig) {
      return this._cachedConfig;
    }

    const item = localStorage.getItem(this.configKey);

    this._cachedConfig = item
      ? merge(
          {},
          this.defaultConfig,
          JSON.parse(item, (key, value) => {
            if (
              typeof value === 'object' &&
              Object.keys(value).length === 2 &&
              value.__type__ === 'Set' &&
              value.value !== undefined
            ) {
              return Array.isArray(value.value)
                ? new Set(value.value)
                : new Set();
            }
            return value;
          }) as Config,
        )
      : { ...this.defaultConfig };

    if (this.migrate) {
      this._cachedConfig = this.migrate(this._cachedConfig);
    }

    return this._cachedConfig;
  }

  public set value(data: Readonly<Config>) {
    // Would've liked to have TS enforce the passed data as immutable (to avoid runtime clone/freeze), so it can't be
    // mutated after the value has been passed to the function, but this is not a thing currently.
    // https://github.com/microsoft/TypeScript/issues/14909
    this._cachedConfig = deepFreeze(data);
    localStorage.setItem(
      this.configKey,
      JSON.stringify(this._cachedConfig, (key, value) => {
        if (value instanceof Set) {
          return { __type__: 'Set', value: Array.from(value) };
        }
        return value;
      }),
    );
  }

  public setValue(config: Readonly<Config>): void;
  public setValue(mutator: (config: Draft<Config>) => void): void;
  public setValue(value: Readonly<Config> | ((config: Draft<Config>) => void)) {
    if (typeof value === 'function') {
      this.value = produce(this.value, value);
    } else {
      this.value = value;
    }
  }

  public reset(): void {
    this._cachedConfig = undefined;
    localStorage.removeItem(this.configKey);
  }
}
