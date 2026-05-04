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

export function stripEnd(str: string, suffix: string) {
  return str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;
}
