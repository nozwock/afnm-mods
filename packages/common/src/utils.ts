import { InventoryItemState, InventoryState, Realm, realms } from 'afnm-types';

// from `rarities`
export const enchantmentNameRarities = [
  'Mundane',
  'Qi Touched',
  'Empowered',
  'Resplendent',
  'Incandescent',
  'Transcendent',
];

const realmsIndex = realms.reduce(
  (acc, it, i) => {
    acc[it] = i;
    return acc;
  },
  {} as Record<string, number>,
);

export function stripEnd(str: string, suffix: string) {
  return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}

export function stripFirstPrefix(str: string, prefixes: string[]): string {
  const match = prefixes.find((p) => str.startsWith(p));
  return match ? str.slice(match.length) : str;
}

export function isRealmReached(charRealm: Realm, realm: Realm): boolean {
  const charRealmIndex = realmsIndex[charRealm];
  const realmIndex = realmsIndex[realm];
  if (charRealmIndex == null || realmIndex == null) return true;
  return charRealmIndex >= realmIndex;
}

export function matchRegisteredKeybind(action: string, event: KeyboardEvent) {
  const key = window.modAPI.utils.getRegisteredKeybindValue(action);
  return (
    key !== undefined &&
    // FIXME: `RegisteredKeybind.code` was supposed to be equivalent to `KeyboardEvent.code` but it isn't. It's instead like
    // `KeyboardEvent.key` but without modifiers (and possibly keyboard layout) affecting it etc, so it can't be matched
    // against `KeyboardEvent.key` reliably either.
    //
    // `code === code` match is so keybinds still keep working when in the future the API gets updated to have proper
    // value for `code`
    (event.key === key.code || event.code === key.code) &&
    event.ctrlKey === key.ctrlKey &&
    event.altKey === key.altKey &&
    event.shiftKey === key.shiftKey
  );
}

export function getFullyRemovedItems(
  inventory: InventoryState,
  prev: InventoryState,
): InventoryItemState[] {
  const ids = new Set(inventory.items.map((item) => item.name));
  return prev.items.filter((item) => !ids.has(item.name));
}

export function getFullyRemovedItem(
  inventory: InventoryState,
  prev: InventoryState,
): InventoryItemState | undefined {
  const ids = new Set(inventory.items.map((item) => item.name));
  return prev.items.find((item) => !ids.has(item.name));
}

export function replaceItems(
  inventory: InventoryState,
  replaceName: (replacedItem: InventoryItemState) => string | null,
  replaceState?: (
    replacedItem: InventoryItemState,
    existingReplacedWithItem?: InventoryItemState,
  ) => InventoryItemState,
): InventoryItemState[] {
  const result = [...inventory.items];

  for (let i = result.length - 1; i >= 0; i--) {
    const item = result[i];

    const replacedWithItemName = replaceName(item);
    if (replacedWithItemName != null) {
      const existingItemIndex = result.findIndex(
        (item) => item.name === replacedWithItemName,
      );
      const existingItem =
        existingItemIndex !== -1 ? result[existingItemIndex] : undefined;

      // Ignore replacing by itself
      if (existingItemIndex === i) continue;

      let replacedWithItem = { ...item, name: replacedWithItemName };
      if (replaceState != null) {
        replacedWithItem = {
          ...replaceState(replacedWithItem, existingItem),
          name: replacedWithItemName,
        };
      } else {
        replacedWithItem = {
          ...(existingItem ?? replacedWithItem),
          stacks: (existingItem?.stacks ?? 0) + item.stacks,
        };
      }

      if (existingItemIndex !== -1) {
        result[existingItemIndex] = replacedWithItem;
        result.splice(i, 1);
      } else {
        result[i] = replacedWithItem;
      }
    }
  }

  return result;
}

export function revertChangedItems(
  inventory: InventoryState,
  inventoryBefore: InventoryState,
  predicate: ((item: InventoryItemState) => boolean) | undefined = undefined,
): InventoryItemState[] {
  const itemNames = new Set(inventory.items.map((item) => item.name));
  const namedItemsBefore = inventoryBefore.items.reduce(
    (acc, item) => {
      acc[item.name] = item;
      return acc;
    },
    {} as Record<string, InventoryItemState>,
  );

  // Changed stack values
  const result = inventory.items.map((item) => {
    let itemBefore = namedItemsBefore[item.name];

    const isItemAdded = !itemBefore;
    if (isItemAdded) return item;

    const isItemChanged = item.stacks !== itemBefore.stacks;
    if (isItemChanged) {
      return predicate
        ? predicate(itemBefore)
          ? itemBefore
          : item
        : itemBefore;
    }

    return item;
  });

  // Adding back removed items
  for (const itemBefore of inventoryBefore.items) {
    if (!itemNames.has(itemBefore.name)) {
      if (!predicate || predicate(itemBefore)) {
        result.push(itemBefore);
      }
    }
  }

  return result;
}
