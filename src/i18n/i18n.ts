import en from './locales/en';
import zh from './locales/zh';

const locales = {
  en,
  zh
};

export type LocaleKey = keyof typeof en;

export function t(key: string, variables: Record<string, any> = {}): string {
  const keys = key.split('.');
  let value: any = locales.en;

  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.error(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
  }

  return value;
}

