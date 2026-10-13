import { toEnglishTiming, stripLeadingName, tithiNumber, karanaEnd } from './panchangam';

describe('toEnglishTiming', () => {
  test.each([
    ['ఉ 7-12', '7:12 AM'],
    ['ప 12-07', '12:07 PM'], // noon hour stays PM
    ['ప 2-36', '2:36 PM'],
    ['సా 5-57', '5:57 PM'],
    ['రా 8-18', '8:18 PM'],
    ['రా 12-04', '12:04 AM (next day)'], // after midnight
    ['రా 2-50', '2:50 AM (next day)'],
    ['రా తె 4-03', '4:03 AM (next day)'], // not 4 pm
  ])('%s -> %s', (text, expected) => expect(toEnglishTiming(text)).toBe(expected));

  test('each side of a span uses its own letter', () => {
    expect(toEnglishTiming('ఉ 11-41 - ప 12-29')).toBe('11:41 AM to 12:29 PM');
    expect(toEnglishTiming('రా 11-55 - రా 1-25')).toBe('11:55 PM to 1:25 AM (next day)');
    expect(toEnglishTiming('రా 1-10 - రా తె 4-03')).toBe('1:10 AM to 4:03 AM (next day)');
  });

  test('every window of a list is kept', () => {
    expect(toEnglishTiming('ఉ 10-05 - ఉ 10-53; ప 2-52 - ప 3-40')).toBe('10:05 AM to 10:53 AM; 2:52 PM to 3:40 PM');
  });

  test('older rows: a second time with no letter takes the last one', () => {
    expect(toEnglishTiming('మ 1-58 మొదలు 3-40 వరకు')).toBe('1:58 PM to 3:40 PM');
  });

  test('text with no recognisable time is returned unchanged', () => {
    expect(toEnglishTiming('నిల్')).toBe('నిల్');
    expect(toEnglishTiming('')).toBe('');
  });
});

describe('stripLeadingName', () => {
  test('removes the tithi name the timing already carries', () => {
    expect(stripLeadingName('పంచమి ప 2-36', ['Panchami', 'పంచమి'])).toBe('ప 2-36');
  });
});

describe('tithiNumber', () => {
  test.each([['Tadiya', 3], ['Pournami', 15], ['Amavasya', 15], ['Chaturdashi', 14], ['Padyami', 1], ['Thadiya', null], ['', null]])(
    '%s -> %s', (name, n) => expect(tithiNumber(name)).toBe(n));
});

describe('karanaEnd', () => {
  const day = '2026-10-13';
  test('the last karana that ends the next morning is marked in English', () => {
    expect(karanaEnd({ timing: 'ఉ 10-32', ends_at: '2026-10-14T10:32+05:30' }, day, true)).toBe('10:32 AM (next day)');
  });
  test('a karana that ends the same day is not', () => {
    expect(karanaEnd({ timing: 'రా 9-51', ends_at: '2026-10-13T21:51+05:30' }, day, true)).toBe('9:51 PM');
  });
  test('an end after midnight is marked once', () => {
    expect(karanaEnd({ timing: 'రా 1-20', ends_at: '2026-10-14T01:20+05:30' }, day, true)).toBe('1:20 AM (next day)');
  });
  test('Telugu shows the book text', () => {
    expect(karanaEnd({ timing: 'ఉ 10-32', ends_at: '2026-10-14T10:32+05:30' }, day, false)).toBe('ఉ 10-32');
  });
});
