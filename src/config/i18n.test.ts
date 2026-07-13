import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE, i18n, LOCALE_DIRECTIONS } from './i18n';

describe('i18n (ADR-035)', () => {
  afterEach(async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE);
  });

  it('defaults to Hebrew', () => {
    expect(i18n.language).toBe('he');
    expect(i18n.t('nav.games')).toBe('משחקים');
  });

  it('switches to English at runtime', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.games')).toBe('Games');
    expect(i18n.t('titles.discover')).toBe('Find Teammates');
  });

  it('maps locales to the correct direction', () => {
    expect(LOCALE_DIRECTIONS.he).toBe('rtl');
    expect(LOCALE_DIRECTIONS.en).toBe('ltr');
  });

  it('falls back to Hebrew for missing locales', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('nav.games')).toBe('משחקים');
  });
});
