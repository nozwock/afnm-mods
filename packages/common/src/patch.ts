export interface Patch<Config = unknown> {
  name: string;
  unsubscribers?: (() => void)[];
  isEnabled?(config: Readonly<Config>): boolean;
  onEnable(): void;
  onDisable?(): void;

  [key: string]: unknown; // For patch state and helpers
}

export class PatchManager {
  constructor() {}

  private patches = new Map<
    Patch,
    {
      isInitialized: boolean;
    }
  >();

  private addIfNotPresent(patch: Patch): void {
    if (!this.patches.has(patch)) {
      this.patches.set(patch, {
        isInitialized: false,
      });
    }
  }

  /**
   * `Patch` is enabled unconditionally if `isEnabled` is not defined.
   */
  public tryEnable<Config>(patch: Patch<Config>, config?: Config): void {
    if (!patch.isEnabled || (config !== undefined && patch.isEnabled(config))) {
      this.enable(patch);
    }
  }

  public enable(patch: Patch): void {
    this.addIfNotPresent(patch);

    const state = this.patches.get(patch)!;
    if (state.isInitialized) return;
    state.isInitialized = true;

    console.log(`Enabling ${patch.name}`);
    patch.onEnable();
  }

  public disable(patch: Patch): void {
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
