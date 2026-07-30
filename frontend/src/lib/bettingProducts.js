const PRODUCT_TRANSLATION_KEYS = {
  WIN: {
    name: 'betProductTop1Name',
    description: 'betProductTop1Description'
  },
  PLACE: {
    name: 'betProductTop3Name',
    description: 'betProductTop3Description'
  }
};

function translationKeys(code) {
  return PRODUCT_TRANSLATION_KEYS[String(code || '').toUpperCase()];
}

export function betProductName(code, t, fallback = '') {
  const keys = translationKeys(code);
  return keys ? t(keys.name) : fallback || String(code || '');
}

export function betProductDescription(code, t, fallback = '') {
  const keys = translationKeys(code);
  return keys ? t(keys.description) : fallback;
}
