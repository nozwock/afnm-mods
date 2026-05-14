/**
 * A hack to remove padding from component's container, which leaves the scrollbar to the right-most edge instead of
 * floating some distance away from it.
 *
 * Made for `0.6.56`.
 */
export function removeSettingsDialogPadding(
  optionUIRef: React.RefObject<Node | null>,
) {
  let node = optionUIRef.current?.parentNode;
  while (
    node instanceof HTMLElement &&
    !node.classList.contains('MuiDialogContent-root')
  ) {
    node.style.padding = '0';
    node = node.parentNode;
  }
}
