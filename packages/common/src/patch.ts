export interface Patch<Config = unknown> {
  name: string;
  unsubscribers?: (() => void)[];
  isEnabled?(config: Readonly<Config>): boolean;
  onEnable(): void;
  onDisable?(): void;
}

export class PatchManager<Config> {
  constructor(getConfig: () => Config) {
    this.getConfig = getConfig;
  }

  private getConfig;
  private patches = new Map<
    Patch<Config>,
    {
      isInitialized: boolean;
    }
  >();

  private addIfNotPresent(patch: Patch<Config>): void {
    if (!this.patches.has(patch)) {
      this.patches.set(patch, {
        isInitialized: false,
      });
    }
  }

  /**
   * `Patch` is enabled unconditionally if `isEnabled` is not defined.
   */
  public tryEnable(patch: Patch<Config>): void {
    if (!patch.isEnabled || patch.isEnabled(this.getConfig())) {
      this.enable(patch);
    }
  }

  public enable(patch: Patch<Config>): void {
    this.addIfNotPresent(patch);

    const state = this.patches.get(patch)!;
    if (state.isInitialized) return;
    state.isInitialized = true;

    console.log(`Enabling ${patch.name}`);
    patch.onEnable();
  }

  public disable(patch: Patch<Config>): void {
    if (!patch.onDisable && !patch.unsubscribers) return;

    const state = this.patches.get(patch);
    if (state === undefined) return;
    if (!state.isInitialized) return;
    state.isInitialized = false;

    console.log(`Disabling ${patch.name}`);

    if (patch.unsubscribers) {
      let unsubscriber: (() => void) | undefined = undefined;
      while ((unsubscriber = patch.unsubscribers.pop()) !== undefined) {
        unsubscriber();
      }
    }

    if (patch.onDisable) {
      patch.onDisable();
    }
  }
}
