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

/* Day-period letters in the timing texts, as the engine writes them (sohum-contracts, docs/PANCHANGAM_DAY_SHAPE.md section 3):
     ఉ  sunrise to noon            ప  noon to 4 pm            సా  4 pm to 7 pm
     రా  7 pm until the last quarter of the night (so రా 12-04 is 12:04 am, after midnight)
     రా తె  the last quarter of the night, up to sunrise (always am, after midnight)
   A 12-hour clock needs the letter to say which half of the day it is. Older hand-entered rows use మ / మధ్యాహ్నం for midday
   and the spelled-out ఉదయం / సాయంత్రం / రాత్రి, and write a second time with no letter of its own ("మ 1-58 మొదలు 3-40 వరకు"),
   so a time without a letter takes the last one seen. */
const LETTERS = {
  'ఉ': 'morning', 'ఉదయం': 'morning',
  'ప': 'midday', 'పగలు': 'midday', 'మ': 'midday', 'మధ్యాహ్నం': 'midday',
  'సా': 'evening', 'సాయంత్రం': 'evening',
  'రా': 'night', 'రాత్రి': 'night',
};
const TIME_TOKEN_RE = /^(\d{1,2})-(\d{2})$/;

/* One "h-mm" time with its letter -> { text: "h:mm AM", nextDay }. nextDay is true for times after midnight. */
function renderTime(letter, token) {
  const [, hour, minute] = token.match(TIME_TOKEN_RE);
  const h = Number(hour);
  const clock = `${h}:${minute}`;
  switch (letter) {
    case 'morning': return { text: `${clock} AM`, nextDay: false };
    case 'midday':
    case 'evening': return { text: `${clock} PM`, nextDay: false };
    case 'night': return h >= 7 && h <= 11 ? { text: `${clock} PM`, nextDay: false } : { text: `${clock} AM`, nextDay: true };
    case 'small-hours': return { text: `${clock} AM`, nextDay: true };
    default: return { text: token, nextDay: false }; // no letter seen: leave the time as written
  }
}

function toEnglishSpan(span) {
  const tokens = span.trim().split(/\s+/);
  const times = [];
  let letter = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok === 'రా' && tokens[i + 1] === 'తె') { letter = 'small-hours'; i += 1; }
    else if (LETTERS[tok]) letter = LETTERS[tok];
    else if (TIME_TOKEN_RE.test(tok)) times.push(renderTime(letter, tok));
  }
  if (times.length === 0) return null;
  const last = times[times.length - 1];
  return `${times.map(t => t.text).join(' to ')}${last.nextDay ? ' (next day)' : ''}`;
}

/**
 * Converts a Telugu-formatted timing string like "ప 1-35 - ప 3-04" or the older
 * "మ 1-58 మొదలు 3-40 వరకు" into "1:35 PM to 3:04 PM" for English mode. Several
 * windows separated by ";" are each converted ("ఉ 10-05 - ఉ 10-53; ప 2-52 - ప 3-40"),
 * and a time after midnight is marked "(next day)". Only recognized letters,
 * "h-mm" tokens and the from/until words are interpreted; the whole string is
 * returned unchanged if no time token is found at all - this only ever
 * reformats recognized time data, never guesses.
 */
export function toEnglishTiming(timing) {
  if (!timing) return '';
  const spans = timing.split(';').map(toEnglishSpan).filter(Boolean);
  return spans.length === 0 ? timing : spans.join('; ');
}

/* Applies toEnglishTiming only when the site is in English; Telugu mode
   shows the original admin-entered text unchanged. */
export function formatTiming(timing, isEnglish) {
  return isEnglish ? toEnglishTiming(timing) : timing || '';
}
