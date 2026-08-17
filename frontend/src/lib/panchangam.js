/**
 * Panchangam "timing" fields (tithi_timing, nakshatra_timing) are admin-entered
 * free text that already spells out the tithi/nakshatra name before the time
 * (e.g. "పంచమి ఉ 7-12"), since that's the source spreadsheet's format. The UI
 * shows the name separately above, so strip the leading name here to avoid
 * showing it twice and leave just the "until <time>" part.
 */
export function stripLeadingName(timing, names) {
  if (!timing) return '';
  let result = timing.trim();
  for (const name of names) {
    const trimmedName = (name || '').trim();
    if (trimmedName && result.toLowerCase().startsWith(trimmedName.toLowerCase())) {
      result = result.slice(trimmedName.length).trim();
      break;
    }
  }
  return result.replace(/^[:\-–,]+\s*/, '');
}
