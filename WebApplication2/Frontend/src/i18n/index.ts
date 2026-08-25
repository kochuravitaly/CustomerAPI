import en from './en';
import ru from './ru';
import de from './de';

export type Language = 'en' | 'ru' | 'de';

export const translations = {
    en,
    ru,
    de,
};

export type TranslationKeys = typeof en;