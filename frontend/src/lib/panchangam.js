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

/* Telugu day-period markers used throughout the source data (e.g. tithi/
   nakshatra timing, varjyam, durmuhurtham): ఉదయం (morning) is before noon,
   మధ్యాహ్నం/సాయంత్రం/రాత్రి (noon/evening/night) are all after noon before the
   next midnight - so in strict 12-hour-clock terms ఉ maps to AM and the other
   three all map to PM. */
const PERIOD_TO_AMPM = {
  'ఉ': 'AM', 'ఉదయం': 'AM',
  'మ': 'PM', 'మధ్యాహ్నం': 'PM',
  'సా': 'PM', 'సాయంత్రం': 'PM',
  'రా': 'PM', 'రాత్రి': 'PM',
};
const TIME_TOKEN_RE = /^\d{1,2}-\d{2}$/;

/**
 * Converts a Telugu-formatted timing string like "మ 1-58 మొదలు 3-40 వరకు"
 * (period-marker, start time, "from", end time, "until") into "1-58 PM to
 * 3-40 PM" for English mode. Only the recognized period markers, "HH-MM"
 * time tokens, and the from/until connector words are interpreted; any
 * other token (e.g. a redundant field-name-letter prefix some entries
 * carry) is dropped once a time or period token has been seen, and the
 * whole string is returned unchanged if no time token is found at all -
 * this only ever narrows/reformats recognized time data, never guesses.
 */
export function toEnglishTiming(timing) {
  if (!timing) return '';
  const tokens = timing.trim().split(/\s+/);
  const times = [];
  let period = null;
  for (const tok of tokens) {
    if (PERIOD_TO_AMPM[tok] && !period) period = PERIOD_TO_AMPM[tok];
    else if (TIME_TOKEN_RE.test(tok)) times.push(tok);
  }
  if (times.length === 0) return timing;
  const suffix = period ? ` ${period}` : '';
  if (times.length === 1) return `${times[0]}${suffix}`;
  return `${times[0]}${suffix} to ${times[1]}${suffix}`;
}

/* Applies toEnglishTiming only when the site is in English; Telugu mode
   shows the original admin-entered text unchanged. */
export function formatTiming(timing, isEnglish) {
  return isEnglish ? toEnglishTiming(timing) : timing || '';
}
