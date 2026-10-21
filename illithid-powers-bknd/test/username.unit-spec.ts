import { describe, expect, it } from '@jest/globals';
import { foldUsername, normalizeUsername, USERNAME_PATTERN } from '../src/common/username';

const valid = (name: string) => USERNAME_PATTERN.test(normalizeUsername(name) as string);

describe('player names', () => {
  it.each([
    ['plain ASCII', 'Srosu'],
    ['accents', 'Zoë'],
    ['an apostrophe', "O'Brien"],
    ['spaces between words', 'Sir Elk'],
    ['hyphens, dots and underscores', 'Mary-Jane_Smith.Jr'],
    ['numbers', 'Player 2'],
    ['letters from other languages', 'Мария'],
    ['a decomposed accent (e + combining diaeresis)', 'Zoe\u0308'],
    ['a curly apostrophe', 'O\u2019Brien'],
  ])('accepts %s', (_label, name) => {
    expect(valid(name)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['only spaces', '   '],
    ['no letter or number', "-.'_"],
    ['a tab inside', 'a\tb'],
    ['a newline inside', 'a\nb'],
    ['a non-breaking space', 'a\u00a0b'],
    ['an invisible zero-width space', 'a\u200bb'],
    ['an emoji', 'a😀'],
    ['punctuation', 'semi;colon'],
    ['a lone combining accent', '\u0308'],
    ['a word starting with a combining accent', 'a \u0308b'],
  ])('rejects %s', (_label, name) => {
    expect(valid(name)).toBe(false);
  });

  it('normalizes to one canonical form', () => {
    expect(normalizeUsername('  Sir   Elk  ')).toBe('Sir Elk');
    expect(normalizeUsername('O\u2019Brien')).toBe("O'Brien");
    expect(normalizeUsername('Zoe\u0308')).toBe('Zoë'); // composed
    expect(normalizeUsername(42)).toBe(42); // non-strings are left for validation to reject
  });

  it('compares names ignoring capitals, accents-composition and spacing, which SQLite lower() cannot', () => {
    expect(foldUsername('ZOË')).toBe(foldUsername('zoë'));
    expect(foldUsername('Zoe\u0308')).toBe(foldUsername('ZOË'));
    expect(foldUsername("O\u2019BRIEN")).toBe(foldUsername("o'brien"));
    expect(foldUsername('Sir  Elk')).toBe(foldUsername('sir elk'));
    expect(foldUsername('Elk')).not.toBe(foldUsername('Elks'));
  });
});
