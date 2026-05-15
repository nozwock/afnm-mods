export interface Patch {
  name: string;
  unsubscribers?: (() => void)[];
  isEnabled?(): boolean;
  onEnable(): void;
  onDisable?(): void;
}

/**
 * Helper function to define a `Patch` object with type checking while allowing for additional properties, since a plain
 * `satisfies Patch` won't work.
 *
 * @example
 * definePatch({
 *  // ...
 *  unsubscribers: [] as (() => void)[],
 *  isEnabled() {
 *    return modConfig.value.myPatch.enabled;
 *  },
 * })
 */
export const definePatch = <T>(patch: T & Patch) => patch;

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
  public tryEnable(patch: Patch): void {
    if (!patch.isEnabled || patch.isEnabled()) {
      this.enable(patch);
    }
  }

  /**
   * Use `Patch.isEnabled` if `enabled` is not passed, effectively acting like `tryEnable` but also for disabling.
   */
  public setEnabled(patch: Patch): void;
  public setEnabled(patch: Patch, enabled: boolean): void;
  public setEnabled(patch: Patch, enabled?: boolean): void {
    if (enabled === undefined) {
      enabled = patch.isEnabled ? patch.isEnabled() : true;
    }
    if (enabled) {
      this.enable(patch);
    } else {
      this.disable(patch);
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
