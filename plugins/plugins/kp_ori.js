(function () {
    'use strict';

    /**
     * Плагин для Lampa: КиноПоиск через kinopoiskapiunofficial.tech
     * ------------------------------------------------------------
     * - добавляет в левое меню пункт "КиноПоиск" (перед "Каталог")
     * - открывает главную с рядами: Премьеры месяца, Сейчас смотрят,
     *   Топ-250 фильмов/сериалов, Популярные фильмы/сериалы
     * - карточки открываются в штатной деталке Lampa (описание, актёры, похожее)
     * - источник "kpu" можно также выбрать основным в Настройки -> Источник
     *
     * Настройки -> КиноПоиск API: свой токен, CORS-прокси, показ пункта меню.
     * Код намеренно написан на ES5 (var/function) для старых WebView.
     */

    // ============================================================
    //  ЧАСТЬ 1 — ДОМЕН-ГЕЙТ
    //  Держите этот блок читаемым (можно НЕ обфусцировать или вынести
    //  в отдельный файл, подключаемый ПОСЛЕ ядра). Плагин запускается
    //  только на перечисленных доменах. Редактируйте список при желании.
    // ============================================================
    var KPU_ALLOWED_HOSTS = ['lampa.mx', 'cf.lampa.mx', 'lampa.byskaz.ru'];

    var KPU_HOST = '';
    try { KPU_HOST = ((window.location && window.location.hostname) || '').toLowerCase(); } catch (e) {}

    if (KPU_ALLOWED_HOSTS.indexOf(KPU_HOST) === -1) return;

    // ============================================================
    //  ЧАСТЬ 2 — ЯДРО ПЛАГИНА (это можно обфусцировать целиком).
    //  Чтобы разнести на два файла: вынесите тело kpuCore() в отдельный
    //  файл как  window.kpuCore = function () { ... };  а в гейте выше
    //  замените вызов на:  if (window.kpuCore) window.kpuCore();
    // ============================================================
    kpuCore();

    function kpuCore() {

    if (window.plugin_kpu_ready) return;
    window.plugin_kpu_ready = true;

    // ------------------------------------------------------------ config
    var SOURCE_NAME  = 'kpu';
    var SOURCE_TITLE = 'КиноПоиск';
    var MENU_TITLE   = 'КиноПоиск';
    var DEFAULT_KEY  = 'af2abc96-b940-480a-a859-12e2378bca4d';
    var DEFAULT_PROXY = 'https://cors.byskaz.ru/';
    var API_BASE     = 'https://kinopoiskapiunofficial.tech/';

    var network = new Lampa.Reguest();
    var cache   = {};
    var CACHE_TIME = 1000 * 60 * 60; // 1 час

    function apiKey() { return DEFAULT_KEY; }      // зашиты в код, без настроек
    function proxy()  { return DEFAULT_PROXY; }     // fallback-прокси при CORS/ошибке
    function postersDirect() { return true; }       // постеры — прямой адрес Яндекс-CDN

    function extend(target, src) {
        for (var k in src) if (src.hasOwnProperty(k)) target[k] = src[k];
        return target;
    }

    // Постеры API отдаёт как ссылки на kinopoiskapiunofficial.tech, которые 301-редиректят
    // на Яндекс-CDN. Подставляем конечный URL сразу, чтобы не было лишнего запроса.
    //   .../posters/kp_small/{id}.jpg -> st.kp.yandex.net/images/film_iphone/iphone360_{id}.jpg
    //   .../posters/kp/{id}.jpg       -> st.kp.yandex.net/images/film_big/{id}.jpg
    function directPoster(url) {
        if (!url || !postersDirect()) return url || '';
        url = url.replace(/^https?:\/\/[^\/]*kinopoiskapiunofficial\.tech\/images\/posters\/kp_small\/(\d+)\.jpg.*$/i,
                          'https://st.kp.yandex.net/images/film_iphone/iphone360_$1.jpg');
        url = url.replace(/^https?:\/\/[^\/]*kinopoiskapiunofficial\.tech\/images\/posters\/kp\/(\d+)\.jpg.*$/i,
                          'https://st.kp.yandex.net/images/film_big/$1.jpg');
        return url;
    }

    // Страховка: если прямого постера на CDN нет (битая картинка) — возвращаем исходный
    // редиректящий URL. Ошибка загрузки <img> не всплывает, поэтому слушаем в фазе capture.
    function installPosterFallback() {
        if (window.kpu_poster_fallback) return;
        window.kpu_poster_fallback = true;
        document.addEventListener('error', function (e) {
            var img = e.target;
            if (!img || img.tagName !== 'IMG' || img.getAttribute('data-kpu-fb')) return;
            var src = img.src || '', m;
            if ((m = src.match(/st\.kp\.yandex\.net\/images\/film_iphone\/iphone360_(\d+)\.jpg/i))) {
                img.setAttribute('data-kpu-fb', '1');
                img.src = 'https://kinopoiskapiunofficial.tech/images/posters/kp_small/' + m[1] + '.jpg';
            } else if ((m = src.match(/st\.kp\.yandex\.net\/images\/film_big\/(\d+)\.jpg/i))) {
                img.setAttribute('data-kpu-fb', '1');
                img.src = 'https://kinopoiskapiunofficial.tech/images/posters/kp/' + m[1] + '.jpg';
            }
        }, true);
    }

    // ------------------------------------------------------------ network
    // Прямой запрос с X-API-KEY. При CORS / 0 / 429 / 451 — повтор через прокси (если задан).
    function get(method, oncomplite, onerror) {
        var url    = API_BASE + method;
        var params = { headers: { 'X-API-KEY': apiKey() } };

        network.timeout(20000);
        network.silent(url, oncomplite, function (a) {
            var px = (proxy() || '').replace(/\s+/g, '');
            var retryable = a && (a.status === 429 || a.status === 451 || a.status === 0 || a.status === 403);

            if (px && retryable) {
                network.timeout(20000);
                network.silent(px + url, oncomplite, function (b) {
                    if (onerror) onerror(b);
                }, false, params);
            } else if (onerror) onerror(a);
        }, false, params);
    }

    function getComplite(method, oncomplite) {
        get(method, oncomplite, function () { oncomplite(null); });
    }

    function getCache(key) {
        var res = cache[key];
        if (res && res.timestamp > new Date().getTime() - CACHE_TIME) return res.value;
        return null;
    }
    function setCache(key, value) { cache[key] = { timestamp: new Date().getTime(), value: value }; }
    function clear() { network.clear(); }

    // ------------------------------------------------------------ mappers
    // Элемент КиноПоиска -> карточка в формате Lampa (как TMDB).
    function convertElem(elem) {
        if (!elem) return null;

        var type  = (!elem.type || elem.type === 'FILM' || elem.type === 'VIDEO') ? 'movie' : 'tv';
        var kpid  = elem.kinopoiskId || elem.filmId || 0;
        var krat  = parseFloat(elem.ratingKinopoisk || elem.rating || 0) || 0;
        var irat  = parseFloat(elem.ratingImdb || elem.ratingImbd || 0) || 0;
        var title = elem.nameRu || elem.nameEn || elem.nameOriginal || '';
        var orig  = elem.nameOriginal || elem.nameEn || elem.nameRu || '';
        var adult = false;

        var genres = [];
        if (elem.genres) for (var i = 0; i < elem.genres.length; i++) {
            if (elem.genres[i].genre === 'для взрослых') adult = true;
            genres.push({ id: 0, name: elem.genres[i].genre, url: 'genre' });
        }

        var countries = [];
        if (elem.countries) for (var j = 0; j < elem.countries.length; j++)
            countries.push({ name: elem.countries[j].country });

        var card = {
            source: SOURCE_NAME,
            type: type,
            adult: adult,
            id: SOURCE_NAME + '_' + kpid,
            kinopoisk_id: kpid,
            imdb_id: elem.imdbId || '',
            title: title,
            original_title: orig,
            overview: elem.description || elem.shortDescription || '',
            img: directPoster(elem.posterUrlPreview || elem.posterUrl || ''),
            background_image: directPoster(elem.coverUrl || elem.posterUrl || elem.posterUrlPreview || ''),
            vote_average: krat,
            vote_count: elem.ratingKinopoiskVoteCount || elem.ratingVoteCount || 0,
            kp_rating: krat,
            imdb_rating: irat,
            genres: genres,
            production_companies: [],
            production_countries: countries
        };

        var year = (elem.year && elem.year !== 'null') ? elem.year + '' : '';
        var date = elem.premiereRu || elem.releaseDate || year;

        if (type === 'tv') {
            card.name = title;
            card.original_name = orig;
            card.first_air_date = (elem.startYear && elem.startYear !== 'null') ? elem.startYear + '' : (date || year);
            if (elem.endYear && elem.endYear !== 'null') card.last_air_date = elem.endYear + '';
        } else {
            card.release_date = date || year;
        }

        // Актёры / съёмочная группа (если подгрузили staff)
        if (elem.staff_obj) {
            var cast = [], crew = [];
            for (var s = 0; s < elem.staff_obj.length; s++) {
                var st = elem.staff_obj[s];
                var person = {
                    id: st.staffId,
                    name: st.nameRu || st.nameEn || '',
                    url: 'person',
                    img: st.posterUrl || '',
                    character: st.description || '',
                    job: Lampa.Utils.capitalizeFirstLetter((st.professionKey || '').toLowerCase())
                };
                if (st.professionKey === 'ACTOR') cast.push(person); else crew.push(person);
            }
            card.persons = { cast: cast, crew: crew };
        }

        // Похожие
        if (elem.similars_obj) {
            var sim = [];
            var items = elem.similars_obj.items || [];
            for (var m = 0; m < items.length; m++) {
                var c = convertElem(items[m]);
                if (c) sim.push(c);
            }
            card.simular = { results: sim };
        }

        return card;
    }

    // ------------------------------------------------------------ list / full
    function getList(method, params, oncomplite, onerror) {
        var url = method;

        if (params.query) {
            var q = (decodeURIComponent(params.query) + '').replace(/[\s.,:;!?]+/g, ' ').trim();
            if (!q) { if (onerror) onerror(); return; }
            url = Lampa.Utils.addUrlComponent(url, 'keyword=' + encodeURIComponent(q));
        }

        var page = params.page || 1;
        if (url.indexOf('premieres') === -1 && url.indexOf('search-by-keyword') === -1)
            url = Lampa.Utils.addUrlComponent(url, 'page=' + page);
        else if (url.indexOf('search-by-keyword') !== -1)
            url = Lampa.Utils.addUrlComponent(url, 'page=' + page);

        var handle = function (json) {
            if (!json) { if (onerror) onerror(); return; }
            setCache(url, json);

            var raw = json.items || json.films || json.releases || [];
            var results = [];
            for (var i = 0; i < raw.length; i++) {
                var c = convertElem(raw[i]);
                if (c && !c.adult) results.push(c);
            }
            var total_pages = json.totalPages || json.pagesCount || 1;

            oncomplite({
                results: results,
                url: method,
                page: page,
                total_pages: total_pages,
                total_results: json.total || results.length,
                more: total_pages > page
            });
        };

        var cached = getCache(url);
        if (cached) setTimeout(function () { handle(cached); }, 10);
        else get(url, handle, onerror);
    }

    function list(params, oncomplite, onerror) {
        var method = params.url || 'api/v2.2/films/collections?type=TOP_POPULAR_MOVIES';

        if ((method === '' || method === 'movie' || method === 'tv' || method === 'genre') && params.genres)
            method = 'api/v2.2/films?order=NUM_VOTE&genres=' + params.genres;

        getList(method, params, oncomplite, onerror);
    }

    // Деталка: фильм + актёры + похожее
    function full(params, oncomplite, onerror) {
        var id = '';
        if (params.card && params.card.source === SOURCE_NAME) {
            if (params.card.kinopoisk_id) id = params.card.kinopoisk_id;
            else if ((params.card.id + '').indexOf(SOURCE_NAME + '_') === 0)
                id = (params.card.id + '').substring(SOURCE_NAME.length + 1);
        }
        if (!id) { if (onerror) onerror(); return; }

        var url = 'api/v2.2/films/' + id;

        var build = function (film) {
            if (!film || !film.kinopoiskId) { if (onerror) onerror(); return; }
            var json = convertElem(film);
            var status = new Lampa.Status(3);
            status.onComplite = oncomplite;
            status.append('movie', json);
            status.append('persons', json && json.persons);
            status.append('simular', json && json.simular);
        };

        var cached = getCache(url);
        if (cached) { setTimeout(function () { build(cached); }, 10); return; }

        get(url, function (film) {
            if (!film || !film.kinopoiskId) { if (onerror) onerror(); return; }
            getComplite('api/v1/staff?filmId=' + id, function (staff) {
                film.staff_obj = staff;
                getComplite('api/v2.2/films/' + id + '/similars', function (similars) {
                    film.similars_obj = similars;
                    setCache(url, film);
                    build(film);
                });
            });
        }, onerror);
    }

    function search(params, oncomplite) {
        var title = decodeURIComponent(params.query || '');
        var status = new Lampa.Status(1);

        status.onComplite = function (data) {
            var items = [];
            if (data.query && data.query.results) {
                var movie = extend({}, data.query);
                movie.results = data.query.results.filter(function (e) { return e.type === 'movie'; });
                movie.title = Lampa.Lang.translate('menu_movies'); movie.type = 'movie';
                if (movie.results.length) items.push(movie);

                var tv = extend({}, data.query);
                tv.results = data.query.results.filter(function (e) { return e.type === 'tv'; });
                tv.title = Lampa.Lang.translate('menu_tv'); tv.type = 'tv';
                if (tv.results.length) items.push(tv);
            }
            oncomplite(items);
        };

        getList('api/v2.1/films/search-by-keyword', params, function (json) {
            status.append('query', json);
        }, status.error.bind(status));
    }

    function discovery() {
        return {
            title: SOURCE_TITLE,
            search: search,
            params: { align_left: true, object: { source: SOURCE_NAME } },
            onMore: function (params) {
                Lampa.Activity.push({
                    url: 'api/v2.1/films/search-by-keyword',
                    title: Lampa.Lang.translate('search') + ' - ' + params.query,
                    component: 'category_full',
                    page: 1,
                    query: encodeURIComponent(params.query),
                    source: SOURCE_NAME
                });
            },
            onCancel: network.clear.bind(network)
        };
    }

    // Главная источника: ряды подборок
    function main(params, oncomplite, onerror) {
        params = params || {};
        var rows = [
            [premieresUrl(),                                       'Премьеры месяца'],
            ['api/v2.2/films/collections?type=TOP_POPULAR_MOVIES', 'Сейчас смотрят (фильмы)'],
            ['api/v2.2/films/collections?type=POPULAR_SERIES',     'Сейчас смотрят (сериалы)'],
            ['api/v2.2/films/collections?type=TOP_250_MOVIES',     'Топ-250 фильмов'],
            ['api/v2.2/films/collections?type=TOP_250_TV_SHOWS',   'Топ-250 сериалов'],
            ['api/v2.2/films?order=NUM_VOTE&type=FILM',            'Популярные фильмы'],
            ['api/v2.2/films?order=NUM_VOTE&type=TV_SERIES',       'Популярные сериалы']
        ];

        var parts = [];
        for (var i = 0; i < rows.length; i++) {
            (function (row) {
                parts.push(function (call) {
                    getList(row[0], params, function (json) { json.title = row[1]; call(json); }, call);
                });
            })(rows[i]);
        }

        function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(parts, 5, partLoaded, partEmpty);
        }
        loadPart(oncomplite, onerror);
        return loadPart;
    }

    function category(params, oncomplite, onerror) { main(params, oncomplite, onerror); }
    function menu(params, oncomplite) { oncomplite([]); }
    function menuCategory(params, oncomplite) { oncomplite([]); }
    function seasons() {}
    function person() {}

    var KPU = {
        SOURCE_NAME: SOURCE_NAME,
        SOURCE_TITLE: SOURCE_TITLE,
        main: main,
        menu: menu,
        menuCategory: menuCategory,
        full: full,
        list: list,
        category: category,
        search: search,
        discovery: discovery,
        person: person,
        seasons: seasons,
        clear: clear
    };

    // ------------------------------------------------------------ helpers
    function premieresUrl() {
        var months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                      'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        var d = new Date();
        return 'api/v2.2/films/premieres?year=' + d.getFullYear() + '&month=' + months[d.getMonth()];
    }

    var STAR_ICON = '<svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5345 1.7624C11.8078 1.2375 12.5589 1.2375 12.8322 1.7624L15.6162 7.1098L16.3381 7.6343L22.2841 8.6296C22.8678 8.7274 23.0999 9.4417 22.6851 9.8638L18.184 15.0127L19.0748 20.9752C19.1622 21.5606 18.5546 22.002 18.025 21.738L12.1833 18.8259L6.3417 21.738C5.812 22.002 5.2044 21.5606 5.2919 20.9752L6.1826 15.0127L1.6815 9.8638C1.2668 9.4417 1.4989 8.7274 2.0826 8.6296L8.0285 7.6343L11.5345 1.7624Z" stroke="currentColor" stroke-width="2.2"/></svg>';

    // ------------------------------------------------------------ menu entry
    function menuVisible() { return true; }

    function removeMenuEntry() { $('.menu .menu__list [data-action="kpu_main"]').remove(); }

    function addMenuEntry() {
        if (!menuVisible()) { removeMenuEntry(); return; }
        if ($('.menu .menu__list [data-action="kpu_main"]').length) return;

        var li = $('<li class="menu__item selector" data-action="kpu_main">' +
                     '<div class="menu__ico">' + STAR_ICON + '</div>' +
                     '<div class="menu__text">' + MENU_TITLE + '</div></li>');

        li.on('hover:enter', function () {
            Lampa.Activity.push({ url: '', title: MENU_TITLE, component: 'main', source: SOURCE_NAME, page: 1 });
        });

        var catalog = $('.menu .menu__list [data-action="catalog"]');
        if (catalog.length) li.insertBefore(catalog.first());
        else $('.menu .menu__list').eq(0).append(li);
    }

    // ------------------------------------------------------------ register
    function registerSource() {
        if (Lampa.Api.sources[SOURCE_NAME]) return;

        Lampa.Api.sources[SOURCE_NAME] = KPU;
        Object.defineProperty(Lampa.Api.sources, SOURCE_NAME, { get: function () { return KPU; } });

        var sources = {};
        if (Lampa.Params.values && Lampa.Params.values['source'])
            extend(sources, Lampa.Params.values['source']);
        sources[SOURCE_NAME] = SOURCE_TITLE;
        Lampa.Params.select('source', sources, 'tmdb');
    }

    function startPlugin() {
        registerSource();
        installPosterFallback();
        // меню в Lampa дорисовывается не сразу и может перерисовываться — добавляем с повторами
        setTimeout(addMenuEntry, 200);
        setTimeout(addMenuEntry, 1000);
        setTimeout(addMenuEntry, 2500);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

    } // ===== конец ядра kpuCore =====

})();
