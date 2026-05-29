import { ModReduxAPI, RootState } from 'afnm-types';
import { Draft, produce } from 'immer';
import merge from 'lodash.merge';
import { useMemo } from 'react';

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

export class GlobalModData<T extends object> {
  private key: string;
  private defaultData: Readonly<T>;
  private cachedData?: Readonly<T> = undefined;
  private migrate?: (data: T) => T;

  public constructor(
    key: string,
    defaultValue: T,
    migrate?: typeof this.migrate,
  ) {
    this.key = key;
    this.defaultData = structuredClone(defaultValue);
    this.migrate = migrate;
  }

  public get value(): Readonly<T> {
    if (this.cachedData) {
      return this.cachedData;
    }

    const item = localStorage.getItem(this.key);

    this.cachedData = item
      ? merge({}, this.defaultData, JsonEx.parse(item) as T)
      : { ...this.defaultData };

    if (this.migrate) {
      this.cachedData = this.migrate(this.cachedData);
    }

    return this.cachedData;
  }

  public set value(data: Readonly<T>) {
    // Would've liked to have TS enforce the passed data as immutable (to avoid runtime clone/freeze), so it can't be
    // mutated after the value has been passed to the function, but this is not a thing currently.
    // https://github.com/microsoft/TypeScript/issues/14909
    //
    // Edit: Not going to bother deep-freezing the data. Just expect the user to not modify passed `data` after call.
    this.cachedData = data;
    localStorage.setItem(this.key, JsonEx.stringify(this.cachedData));
  }

  public setValue(data: Readonly<T>): void;
  public setValue(mutator: (data: Draft<T>) => void): void;
  public setValue(value: Readonly<T> | ((data: Draft<T>) => void)) {
    if (typeof value === 'function') {
      this.value = produce(this.value, value);
    } else {
      this.value = value;
    }
  }

  public reset(): void {
    this.cachedData = undefined;
    localStorage.removeItem(this.key);
  }
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
interface TypedJsonValue {
  __type__: string;
  value: JsonValue;
}

export class JsonEx {
  private static withType<T extends JsonValue>(
    typeName: string,
    value: T,
  ): TypedJsonValue {
    return {
      __type__: typeName,
      value: value,
    };
  }

  private static isTyped(
    typeName: string,
    value: any,
  ): value is TypedJsonValue {
    return (
      typeof value === 'object' &&
      Object.keys(value).length === 2 &&
      value.__type__ === typeName &&
      value.value !== undefined
    );
  }

  public static parse(text: string): any {
    return JSON.parse(text, (_, value) => {
      if (this.isTyped('Set', value)) {
        return Array.isArray(value.value) ? new Set(value.value) : new Set();
      }
      return value;
    });
  }

  public static stringify(value: any): string {
    return JSON.stringify(value, (_, value) => {
      if (value instanceof Set) {
        return this.withType('Set', Array.from(value));
      }
      return value;
    });
  }
}
