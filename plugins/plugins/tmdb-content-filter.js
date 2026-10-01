(function () {
  'use strict';

  if (window.__tmdb_content_filter_loaded) return;
  window.__tmdb_content_filter_loaded = true;

  var VERSION = '1.8.0';
  var COMPONENT = 'tmdb_cf';
  // Storage keys stay 'tmdb_cf_*', but the settings rows are injected into
  // Lampa's built-in TMDB settings page (data-component="tmdb") instead of a
  // separate menu entry.
  var SETTINGS_COMPONENT = 'tmdb';
  var LOG = 'TMDB Content Filter';

  var COUNTRY_GROUPS = {
    india_south_asia: ['IN', 'PK', 'BD', 'LK', 'NP', 'AF', 'BT', 'MV'],
    iran_israel: ['IR', 'IL'],
    india: ['IN'],
    pakistan: ['PK'],
    bangladesh: ['BD'],
    south_asia: ['LK', 'NP', 'AF', 'BT', 'MV'],
    korea: ['KR', 'KP'],
    japan: ['JP'],
    china: ['CN', 'HK', 'TW', 'MO'],
    southeast: ['TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'KH', 'LA', 'MM', 'BN', 'TL'],
    central_asia: ['MN', 'KZ', 'UZ', 'TM', 'TJ', 'KG'],
    caucasus: ['AM', 'GE', 'AZ'],
    middle_east: ['IR', 'IQ', 'SA', 'AE', 'IL', 'LB', 'SY', 'JO', 'YE', 'OM', 'QA', 'KW', 'BH', 'PS'],
    arab: ['SA', 'AE', 'EG', 'IQ', 'SY', 'JO', 'LB', 'PS', 'YE', 'OM', 'QA', 'KW', 'BH', 'MA', 'DZ', 'TN', 'LY', 'SD', 'MR', 'SO', 'DJ', 'KM'],
    turkey: ['TR', 'CY'],
    north_africa: ['MA', 'DZ', 'TN', 'LY', 'EG', 'EH', 'MR'],
    russia: ['RU'],
    north_america: ['US', 'CA', 'MX', 'PR', 'GU', 'VI', 'BM', 'KY'],
    latin_america: [
      'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'CR', 'PA', 'DO', 'CU', 'GT', 'HN', 'NI', 'SV',
      'HT', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GY', 'SR', 'GF', 'AW',
    ],
    western_europe: [
      'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT', 'IE', 'LU', 'MC', 'AD', 'LI', 'SM', 'VA', 'MT',
      'IS', 'NO', 'SE', 'DK', 'FI', 'FO', 'GL',
    ],
    eastern_europe: [
      'UA', 'BY', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'MK', 'AL', 'MD', 'EE', 'LV',
      'LT', 'GR', 'XK',
    ],
    africa: [
      'ZA', 'NG', 'KE', 'GH', 'ET', 'TZ', 'UG', 'SN', 'CI', 'CM', 'AO', 'MZ', 'ZW', 'RW', 'SD', 'SO', 'CD', 'CG',
      'BF', 'BJ', 'BW', 'NA', 'ZM', 'MW', 'ML', 'NE', 'TD', 'GA', 'GQ', 'GM', 'GN', 'GW', 'LR', 'SL', 'TG', 'BI',
      'DJ', 'ER', 'SS', 'CF', 'CV', 'KM', 'MG', 'MU', 'SC', 'ST', 'SZ', 'LS',
    ],
    oceania: ['AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'NC', 'PF', 'CK', 'KI', 'MH', 'FM', 'PW', 'NR', 'TV', 'AS', 'MP'],
  };

  // Region-specific languages only — no global en/es/fr/ar in groups (see settings note).
  var LANGUAGE_GROUPS = {
    india_south_asia: ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'pa', 'mr', 'gu', 'or', 'as', 'ur', 'si', 'ne', 'ps', 'dv'],
    iran_israel: ['fa', 'he'],
    india: ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'pa', 'mr', 'gu', 'or', 'as'],
    pakistan: ['ur'],
    bangladesh: ['bn'],
    south_asia: ['si', 'ne', 'ps', 'dv'],
    korea: ['ko'],
    japan: ['ja'],
    china: ['zh'],
    southeast: ['th', 'vi', 'id', 'ms', 'km', 'lo', 'my', 'tl', 'jv'],
    central_asia: ['mn', 'kk', 'uz', 'ky', 'tg'],
    caucasus: ['hy', 'ka', 'az'],
    middle_east: ['fa', 'he', 'ku'],
    arab: ['ar'],
    turkey: ['tr'],
    russia: ['ru', 'ba', 'ce', 'cv', 'tt'],
    latin_america: ['gn', 'qu', 'ht'],
    eastern_europe: ['uk', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'sr', 'bs', 'mk', 'sq', 'et', 'lv', 'lt', 'el', 'be'],
    africa: ['sw', 'am', 'ha', 'yo', 'ig', 'zu', 'af', 'so', 'rw', 'mg', 'ln', 'st', 'sn', 'bm', 'ff', 'wo'],
    oceania: ['mi', 'sm', 'fj'],
  };

  // Short, curated list shown in settings. The other groups above stay
  // defined but are not offered as separate rows.
  var GROUP_ORDER = [
    'india_south_asia',
    'arab',
    'turkey',
    'korea',
    'japan',
    'china',
    'southeast',
    'iran_israel',
  ];

  // Every region key the plugin has ever stored — used to wipe stale state.
  var ALL_GROUP_KEYS = [
    'india_south_asia', 'iran_israel', 'india', 'pakistan', 'bangladesh', 'south_asia',
    'korea', 'japan', 'china', 'southeast', 'central_asia', 'caucasus', 'middle_east',
    'arab', 'turkey', 'north_africa', 'russia', 'north_america', 'latin_america',
    'western_europe', 'eastern_europe', 'africa', 'oceania',
  ];

  var MANIFEST = {
    type: 'other',
    version: VERSION,
    name: 'TMDB Content Filter',
    description: 'Hide TMDB catalog rows by country or original language',
    author: '@pavelpikta',
    component: COMPONENT,
    icon:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/><path d="M8 8l8 8" stroke-width="1.2"/></svg>',
  };

  function t(key) {
    return Lampa.Lang.translate(key);
  }

  function addLang() {
    Lampa.Lang.add({
      tmdb_cf_settings_name: { en: 'TMDB Content Filter', ru: 'Фильтр контента TMDB' },
      tmdb_cf_enabled: {
        en: 'Enable content filter',
        ru: 'Включить фильтр контента',
      },
      tmdb_cf_enabled_desc: {
        en: 'Hide catalog titles by region — each region matches on its production country or its original language',
        ru: 'Скрывать тайтлы по региону — регион срабатывает по стране производства или по оригинальному языку',
      },
      tmdb_cf_title_country: {
        en: 'Hide by country of origin',
        ru: 'Скрывать по стране производства',
      },
      tmdb_cf_title_country_desc: {
        en: 'Uses origin_country and production_countries from TMDB',
        ru: 'По полям origin_country и production_countries в TMDB',
      },
      tmdb_cf_title_language: {
        en: 'Hide by original language',
        ru: 'Скрывать по оригинальному языку',
      },
      tmdb_cf_title_language_desc: {
        en: 'Only original_language — not spoken_languages. Groups omit global languages (en, es, fr, …)',
        ru: 'Только original_language, без spoken_languages. Без глобальных языков (en, es, fr, …)',
      },
      tmdb_cf_lang_select: {
        en: 'Languages to hide',
        ru: 'Языки для скрытия',
      },
      tmdb_cf_lang_none: {
        en: 'Nothing selected — tap to choose',
        ru: 'Ничего не выбрано — нажмите для выбора',
      },
      tmdb_cf_regions: {
        en: 'Regions to hide',
        ru: 'Регионы для скрытия',
      },
      tmdb_cf_regions_desc: {
        en: 'One list — a region is hidden by its production country and its original language together',
        ru: 'Один список — регион скрывается и по стране производства, и по оригинальному языку сразу',
      },
      tmdb_cf_none: {
        en: 'Nothing selected — tap to choose',
        ru: 'Ничего не выбрано — нажмите для выбора',
      },
      tmdb_cf_block_india_south_asia: {
        en: 'India & South Asia (Hindi, Tamil, Urdu, …)',
        ru: 'Индия и Южная Азия (хинди, тамильский, урду, …)',
      },
      tmdb_cf_block_iran_israel: {
        en: 'Iran & Israel (Farsi, Hebrew)',
        ru: 'Иран и Израиль (фарси, иврит)',
      },
      tmdb_cf_block_india: { en: 'India', ru: 'Индия' },
      tmdb_cf_block_pakistan: { en: 'Pakistan', ru: 'Пакистан' },
      tmdb_cf_block_bangladesh: { en: 'Bangladesh', ru: 'Бангладеш' },
      tmdb_cf_block_south_asia: {
        en: 'Sri Lanka, Nepal, Afghanistan, …',
        ru: 'Шри-Ланка, Непал, Афганистан, …',
      },
      tmdb_cf_block_korea: { en: 'Korea (South & North)', ru: 'Корея (Южная и Северная)' },
      tmdb_cf_block_japan: { en: 'Japan (incl. anime)', ru: 'Япония (вкл. аниме)' },
      tmdb_cf_block_china: { en: 'China / Taiwan / Hong Kong', ru: 'Китай / Тайвань / Гонконг' },
      tmdb_cf_block_southeast: {
        en: 'Southeast Asia (Thai, Vietnamese, Filipino, …)',
        ru: 'Юго-Восточная Азия (тайский, вьетнамский, филиппинский, …)',
      },
      tmdb_cf_block_central_asia: {
        en: 'Central Asia (Kazakhstan, Uzbekistan, …)',
        ru: 'Центральная Азия (Казахстан, Узбекистан, …)',
      },
      tmdb_cf_block_caucasus: {
        en: 'Caucasus (Armenia, Georgia, Azerbaijan)',
        ru: 'Кавказ (Армения, Грузия, Азербайджан)',
      },
      tmdb_cf_block_middle_east: {
        en: 'Middle East (Iran, Arab states, Israel, …)',
        ru: 'Ближний Восток (Иран, арабские страны, Израиль, …)',
      },
      tmdb_cf_block_arab: {
        en: 'Arab countries (Arabic — ar)',
        ru: 'Арабские страны (арабский — ar)',
      },
      tmdb_cf_block_turkey: { en: 'Turkey / Cyprus', ru: 'Турция / Кипр' },
      tmdb_cf_block_north_africa: {
        en: 'North Africa (Morocco, Algeria, Egypt, …)',
        ru: 'Северная Африка (Марокко, Алжир, Египет, …)',
      },
      tmdb_cf_block_russia: { en: 'Russia', ru: 'Россия' },
      tmdb_cf_title_americas: { en: 'Americas', ru: 'Америка' },
      tmdb_cf_block_north_america: {
        en: 'North America (USA, Canada, Mexico, …)',
        ru: 'Северная Америка (США, Канада, Мексика, …)',
      },
      tmdb_cf_block_latin_america: {
        en: 'Latin America (Brazil, Argentina, …)',
        ru: 'Латинская Америка (Бразилия, Аргентина, …)',
      },
      tmdb_cf_title_europe: { en: 'Europe', ru: 'Европа' },
      tmdb_cf_block_western_europe: {
        en: 'Western Europe (UK, France, Germany, …)',
        ru: 'Западная Европа (Великобритания, Франция, Германия, …)',
      },
      tmdb_cf_block_eastern_europe: {
        en: 'Eastern Europe (Ukraine, Poland, Balkans, …)',
        ru: 'Восточная Европа (Украина, Польша, Балканы, …)',
      },
      tmdb_cf_title_other: { en: 'Africa & Oceania', ru: 'Африка и Океания' },
      tmdb_cf_block_africa: {
        en: 'Sub-Saharan Africa (Nigeria, South Africa, …)',
        ru: 'Тропическая Африка (Нигерия, ЮАР, …)',
      },
      tmdb_cf_block_oceania: {
        en: 'Oceania & Pacific (Australia, New Zealand, Fiji, …)',
        ru: 'Океания и Тихий океан (Австралия, Новая Зеландия, Фиджи, …)',
      },
      tmdb_cf_blocked: {
        en: 'This title is hidden by TMDB Content Filter',
        ru: 'Этот тайтл скрыт фильтром контента TMDB',
      },
    });
  }

  function isEnabled() {
    return !!Lampa.Storage.field(COMPONENT + '_enabled');
  }

  function normalizeCountry(code) {
    return String(code || '').toUpperCase();
  }

  function normalizeLanguage(code) {
    return String(code || '').toLowerCase();
  }

  function uniqueList(list) {
    var out = [];
    list.forEach(function (val) {
      if (val && out.indexOf(val) === -1) out.push(val);
    });
    return out;
  }

  function hasLanguageGroup(key) {
    var list = LANGUAGE_GROUPS[key];
    return Array.isArray(list) && list.length > 0;
  }

  // A region is a single switch now. When it is on, the catalog item is
  // hidden if EITHER its production country OR its original language matches
  // that region — so "India" covers Indian movies (language) and Indian
  // series (country) with one tick. Both legacy storage keys are read so
  // older per-axis settings keep working.
  // Each region is a native trigger param stored under its own key.
  function regionEnabled(key) {
    return !!Lampa.Storage.field(COMPONENT + '_region_' + key);
  }

  function getBlockedSets() {
    var countries = {};
    var languages = {};
    var i;
    var key;

    for (i = 0; i < GROUP_ORDER.length; i++) {
      key = GROUP_ORDER[i];

      if (!regionEnabled(key)) continue;

      if (COUNTRY_GROUPS[key]) {
        COUNTRY_GROUPS[key].forEach(function (code) {
          countries[normalizeCountry(code)] = true;
        });
      }

      if (hasLanguageGroup(key)) {
        LANGUAGE_GROUPS[key].forEach(function (code) {
          languages[normalizeLanguage(code)] = true;
        });
      }
    }

    return { countries: countries, languages: languages };
  }

  function hasActiveBlocks(blocked) {
    return (
      Object.keys(blocked.countries).length > 0 || Object.keys(blocked.languages).length > 0
    );
  }

  function isCatalogItem(item) {
    if (!item || typeof item !== 'object' || item.id == null) return false;
    return !!(item.title || item.name || item.original_title || item.original_name);
  }

  function getCountryCodes(item) {
    var codes = [];

    if (Array.isArray(item.origin_country)) {
      item.origin_country.forEach(function (code) {
        if (code) codes.push(normalizeCountry(code));
      });
    }

    if (Array.isArray(item.production_countries)) {
      item.production_countries.forEach(function (country) {
        if (country && country.iso_3166_1) {
          codes.push(normalizeCountry(country.iso_3166_1));
        }
      });
    }

    if (Array.isArray(item.production_companies)) {
      item.production_companies.forEach(function (company) {
        if (company && company.origin_country) {
          codes.push(normalizeCountry(company.origin_country));
        }
      });
    }

    return uniqueList(codes);
  }

  function getOriginalLanguage(item) {
    if (!item || !item.original_language) return '';
    return normalizeLanguage(item.original_language);
  }

  function shouldBlockItem(item, blocked) {
    if (!isCatalogItem(item)) return false;
    blocked = blocked || getBlockedSets();
    if (!hasActiveBlocks(blocked)) return false;

    var codes = getCountryCodes(item);
    var lang = getOriginalLanguage(item);
    var i;

    if (Object.keys(blocked.countries).length > 0) {
      for (i = 0; i < codes.length; i++) {
        if (blocked.countries[codes[i]]) return true;
      }
    }

    if (Object.keys(blocked.languages).length > 0 && lang) {
      if (blocked.languages[lang]) return true;
    }

    return false;
  }

  function looksLikeCatalogResults(results) {
    if (!Array.isArray(results) || !results.length) return false;
    return isCatalogItem(results[0]);
  }

  function filterResultsList(results, blocked) {
    if (!looksLikeCatalogResults(results)) return 0;

    var before = results.length;
    var filtered = results.filter(function (item) {
      return !shouldBlockItem(item, blocked);
    });

    results.length = 0;
    filtered.forEach(function (item) {
      results.push(item);
    });

    return before - filtered.length;
  }

  function filterPayload(data, blocked) {
    if (!data || typeof data !== 'object') return 0;

    var removed = 0;

    if (Array.isArray(data.results)) {
      removed += filterResultsList(data.results, blocked);
      if (typeof data.total_results === 'number' && removed > 0) {
        data.total_results = Math.max(0, data.total_results - removed);
      }
    }

    if (Array.isArray(data)) {
      data.forEach(function (row) {
        if (row && Array.isArray(row.results)) {
          removed += filterResultsList(row.results, blocked);
        }
      });
    }

    if (data.movie && shouldBlockItem(data.movie, blocked)) {
      data.movie = null;
      removed += 1;
    }

    return removed;
  }

  function isCatalogRequest(url) {
    if (typeof url !== 'string') return true;

    var lower = url.toLowerCase();

    // Only skip endpoints that clearly are NOT movie/TV catalog lists.
    // Everything else is allowed through — the real guard is the payload
    // shape check (looksLikeCatalogResults / isCatalogItem), so the source
    // host (TMDB, CUB, proxy, …) does not matter.
    if (lower.indexOf('/person/') !== -1) return false;
    if (lower.indexOf('configuration') !== -1) return false;
    if (lower.indexOf('/genre/') !== -1 && lower.indexOf('list') !== -1) return false;

    return true;
  }

  function onRequestSuccess(e) {
    if (!isEnabled()) return;
    if (!e || !e.data) return;

    var blocked = getBlockedSets();
    if (!hasActiveBlocks(blocked)) return;

    var url = e.params && e.params.url;
    if (!isCatalogRequest(url)) return;

    var removed = filterPayload(e.data, blocked);
    if (removed > 0) {
      console.log(LOG, 'filtered', removed, 'item(s)', url || '');
    }
  }

  function onFullCard(e) {
    if (!isEnabled()) return;
    if (e.type !== 'start') return;

    var blocked = getBlockedSets();
    if (!hasActiveBlocks(blocked)) return;

    var card =
      (e.object && (e.object.movie || e.object.card)) ||
      (e.data && e.data.movie) ||
      null;

    if (!card || !shouldBlockItem(card, blocked)) return;

    if (Lampa.Noty && Lampa.Noty.show) {
      Lampa.Noty.show(t('tmdb_cf_blocked'), { style: 'error', time: 3500 });
    } else if (Lampa.Bell) {
      Lampa.Bell.push({ text: t('tmdb_cf_blocked') });
    }

    setTimeout(function () {
      try {
        Lampa.Activity.backward();
      } catch (err) { }
    }, 120);
  }

  function onSettingsChanged() {
    Lampa.Settings.update();
  }

  function addRegionToggles() {
    Lampa.SettingsApi.addParam({
      component: SETTINGS_COMPONENT,
      param: { name: COMPONENT + '_regions_title', type: 'title' },
      field: { name: t('tmdb_cf_regions') },
      onRender: function (item) {
        item.toggleClass('hide', !isEnabled());
      },
    });

    GROUP_ORDER.forEach(function (key) {
      Lampa.SettingsApi.addParam({
        component: SETTINGS_COMPONENT,
        param: { name: COMPONENT + '_region_' + key, type: 'trigger', default: false },
        field: { name: t('tmdb_cf_block_' + key) },
        onChange: onSettingsChanged,
        onRender: function (item) {
          item.toggleClass('hide', !isEnabled());
        },
      });
    });
  }

  function addSettings() {
    Lampa.SettingsApi.addParam({
      component: SETTINGS_COMPONENT,
      param: { name: COMPONENT + '_enabled', type: 'trigger', default: false },
      field: {
        name: t('tmdb_cf_enabled'),
        description: t('tmdb_cf_enabled_desc'),
      },
      onChange: onSettingsChanged,
    });

    addRegionToggles();
  }

  // One-time cleanup: earlier buggy builds could leave region switches stuck
  // "on" in storage. Clear them once so the list starts from a clean slate
  // (nothing hidden). Runs a single time, guarded by a flag, so it never
  // wipes the user's deliberate choices afterwards.
  function migrateCleanSlate() {
    var FLAG = COMPONENT + '_clean_v17';

    if (Lampa.Storage.field(FLAG)) return;

    ALL_GROUP_KEYS.forEach(function (key) {
      Lampa.Storage.set(COMPONENT + '_country_' + key, false);
      Lampa.Storage.set(COMPONENT + '_lang_' + key, false);
    });

    Lampa.Storage.set(FLAG, true);
  }

  function init() {
    migrateCleanSlate();
    addLang();
    addSettings();
    Lampa.Manifest.plugins = MANIFEST;

    Lampa.Listener.follow('request_secuses', onRequestSuccess);
    Lampa.Listener.follow('full', onFullCard);

    console.log(LOG, 'loaded', VERSION);
  }

  if (window.appready) init();
  else
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') init();
    });
})();
