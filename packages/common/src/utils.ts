import {
  InventoryItemState,
  InventoryState,
  Realm,
  realms,
  RootState,
} from 'afnm-types';

const t = window.modAPI.utils.t;

const realmsIndex = realms.reduce(
  (acc, realm, i) => {
    acc[realm] = i;
    return acc;
  },
  {} as Record<Realm, number>,
);

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  // Freeze properties before freezing self
  for (const key of Reflect.ownKeys(obj) as (keyof T)[]) {
    const value = obj[key];
    if (
      ((value && typeof value === 'object') || typeof value === 'function') &&
      !Object.isFrozen(value) // Assume nested properties to be frozen if current property is frozen
    ) {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

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
    event.code === key.code &&
    event.ctrlKey === key.ctrlKey &&
    event.altKey === key.altKey &&
    event.shiftKey === key.shiftKey
  );
}

/**
 * @returns Mapping of item name (id) to display name.
 */
export function getItemDisplayNames(): Record<string, string> {
  return Object.entries(window.modAPI.gameData.items).reduce(
    (acc, [name, item]) => {
      // `.displayName` is an optional override over `.name`
      acc[name] = t(item.displayName ?? name);
      return acc;
    },
    {} as Record<string, string>,
  );
}

export function getPartyFollowDuration(
  charName: string,
  state: RootState,
): number | undefined {
  // Non-companion character
  const duration =
    window.modAPI.gameData.characters[charName].followInteraction?.duration;
  if (duration !== undefined) return duration;

  // Companion character
  const charData = state.characters.characterData[charName];
  if (!charData) return undefined;

  const relDef =
    charData.relationshipPath === undefined
      ? window.modAPI.gameData.characters[charName]?.relationship?.[
          charData.relationshipIndex
        ]
      : window.modAPI.gameData.characters[charName]?.relationshipPaths?.[
          charData.relationshipPath
        ][charData.relationshipIndex];

  return relDef?.followCharacter?.duration;
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
