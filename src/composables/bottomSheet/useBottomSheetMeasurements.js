const MIN_VISIBLE_OPTION_COUNT = 3;
const DEFAULT_OPTION_HEIGHT_PX = 58;
const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;

export function createBottomSheetMeasurements({sheetRef, bodyRef}) {
  function getSheetChromeHeight() {
    const sheet = sheetRef.value;
    if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX;

    const dragArea = sheet.querySelector('.bottom-sheet-drag-area');
    const header = sheet.querySelector('.bottom-sheet-header');
    const style = window.getComputedStyle(sheet);
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    return Math.ceil(
      (dragArea?.getBoundingClientRect().height || 28) +
        (header?.getBoundingClientRect().height || 50) +
        paddingBottom +
        18
    );
  }

  function getMinimumVisibleBodyHeight() {
    const body = bodyRef.value;
    const options = Array.from(body?.querySelectorAll?.('.bottom-sheet-option') || []);

    if (!options.length) return DEFAULT_OPTION_HEIGHT_PX * MIN_VISIBLE_OPTION_COUNT;

    const totalOptionHeight = options
      .slice(0, MIN_VISIBLE_OPTION_COUNT)
      .reduce((sum, option) => {
        const height = option.getBoundingClientRect().height;
        return sum + (height > 0 ? height : DEFAULT_OPTION_HEIGHT_PX);
      }, 0);

    return Math.ceil(totalOptionHeight + 12);
  }

  function getBodyContentHeight() {
    const body = bodyRef.value;
    if (!body) return 0;

    const children = Array.from(body.children || []);
    if (!children.length) return body.scrollHeight || 0;

    const contentHeight = children.reduce((sum, child) => {
      const height = child.getBoundingClientRect().height;
      return sum + (height > 0 ? height : child.scrollHeight || 0);
    }, 0);

    const style = window.getComputedStyle(body);
    const paddingTop = Number.parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    return Math.ceil(contentHeight + paddingTop + paddingBottom);
  }

  return {getSheetChromeHeight, getMinimumVisibleBodyHeight, getBodyContentHeight};
}
