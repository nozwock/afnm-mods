export class GlobalConfig<Config> {
  private configKey: string;
  private defaultConfig: Config;
  private _cachedConfig?: Config = undefined;

  constructor(key: string, defaultValue: Config) {
    this.configKey = key;
    this.defaultConfig = structuredClone(defaultValue);
  }

  public get value(): Readonly<Config> {
    if (this._cachedConfig) {
      return this._cachedConfig;
    }

    const item = localStorage.getItem(this.configKey);
    this._cachedConfig = item
      ? { ...this.defaultConfig, ...(JSON.parse(item) as Config) }
      : { ...this.defaultConfig };
    return this._cachedConfig;
  }

  public set value(data: Config) {
    // Would've liked to have TS enforce the passed data as immutable (to avoid runtime clone), so it can't be mutated
    // after the value has been passed to the function, but this is not a thing currently.
    // https://github.com/microsoft/TypeScript/issues/14909
    this._cachedConfig = structuredClone(data);
    localStorage.setItem(this.configKey, JSON.stringify(this._cachedConfig));
  }

  public reset(): void {
    this._cachedConfig = undefined;
    localStorage.removeItem(this.configKey);
  }
}
