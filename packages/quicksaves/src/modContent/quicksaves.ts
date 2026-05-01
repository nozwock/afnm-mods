export class QuickSaves {
  private constructor() {}

  private static readonly QUICK_SAVE_REGEX = /^quicksave(\d+)\.json$/;

  static #slotCapacity = 3;

  public static get slotCapacity(): number {
    return this.#slotCapacity;
  }

  public static set slotCapacity(value: number) {
    if (value > 0) {
      this.#slotCapacity = value;
    } else {
      this.#slotCapacity = 1;
    }
  }

  public static async makeQuickSave(): Promise<string> {
    const saves = await this.getQuickSaves();
    let nextSlot = 1;
    if (saves.length > 0) {
      const lastSave = saves[saves.length - 1];
      const lastSlot = this.getSlotNumber(lastSave);

      if (lastSlot !== null) {
        nextSlot = (lastSlot % this.slotCapacity) + 1;
      }
    }
    const filename = `quicksave${nextSlot}.json`;
    console.log(`Writing savefile ${filename}`);
    await window.modAPI.utils.makeSave(filename);
    return filename;
  }

  public static async loadLastQuickSave(): Promise<string | undefined> {
    const saves = await this.getQuickSaves();
    if (saves.length === 0) return;
    const lastSave = saves[saves.length - 1];
    console.log(`Loading savefile ${lastSave}`);
    await window.modAPI.utils.loadSave(lastSave);
    return lastSave;
  }

  private static async getQuickSaves(): Promise<string[]> {
    const saves = await window.modAPI.utils.listSaves();
    return saves
      .filter((save) => {
        return this.QUICK_SAVE_REGEX.test(save.name as string);
      })
      .sort((aSave, bSave) => {
        const aTime = aSave.metadata.lastPlayed as number;
        const bTime = bSave.metadata.lastPlayed as number;

        if (aTime !== bTime) {
          return aTime < bTime ? -1 : 1;
        }

        const aSlot = this.getSlotNumber(aSave.name as string);
        const bSlot = this.getSlotNumber(bSave.name as string);

        if (aSlot !== null && bSlot !== null) {
          return aSlot < bSlot ? -1 : 1;
        }

        return 0;
      })
      .map((save) => save.name as string);
  }

  private static getSlotNumber(filename: string): number | null {
    const match = filename.match(this.QUICK_SAVE_REGEX);
    return match ? Number(match[1]) : null;
  }
}
