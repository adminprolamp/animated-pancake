(function (  ) {
    'use strict';

    function startPlugin() {
      window.plugin_tmdb_mod_ready = true;

      var Episode = function(data) {
        var card = data.card || data;
        var episode = data.next_episode_to_air || data.episode || {};
        if (card.source == undefined) card.source = 'tmdb';
        Lampa.Arrays.extend(card, {
          title: card.name,
          original_title: card.original_name,
          release_date: card.first_air_date
        });
        card.release_year = ((card.release_date || '0000') + '').slice(0, 4);

        function remove(elem) {
          if (elem) elem.remove();
        }

        this.build = function () {
          this.card = Lampa.Template.js('card_episode');
          this.img_poster = this.card.querySelector('.card__img') || {};
          this.img_episode = this.card.querySelector('.full-episode__img img') || {};
          this.card.querySelector('.card__title').innerText = card.title;
          this.card.querySelector('.full-episode__num').innerText = card.unwatched || '';
          if (episode && episode.air_date) {
            this.card.querySelector('.full-episode__name').innerText = ('s' + (episode.season_number || '?') + 'e' + (episode.episode_number || '?') + '. ') + (episode.name || Lampa.Lang.translate('noname'));
            this.card.querySelector('.full-episode__date').innerText = episode.air_date ? Lampa.Utils.parseTime(episode.air_date).full : '----';
          }

          if (card.release_year == '0000') {
            remove(this.card.querySelector('.card__age'));
          } else {
            this.card.querySelector('.card__age').innerText = card.release_year;
          }

          this.card.addEventListener('visible', this.visible.bind(this));
        };

        this.image = function () {
          var _this = this;
          this.img_poster.onload = function () {
          };
          this.img_poster.onerror = function () {
            _this.img_poster.src = './img/img_broken.svg';
          };
          this.img_episode.onload = function () {
            _this.card.querySelector('.full-episode__img').classList.add('full-episode__img--loaded');
          };
          this.img_episode.onerror = function () {
            _this.img_episode.src = './img/img_broken.svg';
          };
        };

        this.create = function () {
          var _this2 = this;
          this.build();
          this.card.addEventListener('hover:focus', function () {
            if (_this2.onFocus) _this2.onFocus(_this2.card, card);
          });
          this.card.addEventListener('hover:hover', function () {
            if (_this2.onHover) _this2.onHover(_this2.card, card);
          });
          this.card.addEventListener('hover:enter', function () {
            if (_this2.onEnter) _this2.onEnter(_this2.card, card);
          });
          this.image();
        };

        this.visible = function () {
          if (card.poster_path) this.img_poster.src = Lampa.Api.img(card.poster_path);
            else if (card.profile_path) this.img_poster.src = Lampa.Api.img(card.profile_path);
            else if (card.poster) this.img_poster.src = card.poster;
            else if (card.img) this.img_poster.src = card.img;
            else this.img_poster.src = './img/img_broken.svg';
          if (card.still_path) this.img_episode.src = Lampa.Api.img(episode.still_path, 'w300');
            else if (card.backdrop_path)  this.img_episode.src = Lampa.Api.img(card.backdrop_path, 'w300');
            else if (episode.img) this.img_episode.src = episode.img;
            else if (card.img) this.img_episode.src = card.img;
            else this.img_episode.src = './img/img_broken.svg';
          if (this.onVisible) this.onVisible(this.card, card);
        };

        this.destroy = function () {
          this.img_poster.onerror = function () {};
          this.img_poster.onload = function () {};
          this.img_episode.onerror = function () {};
          this.img_episode.onload = function () {};
          this.img_poster.src = '';
          this.img_episode.src = '';
          remove(this.card);
          this.card = null;
          this.img_poster = null;
          this.img_episode = null;
        };

        this.render = function (js) {
          return js ? this.card : $(this.card);
        };
      }



var SourceTMDB = function (parent) {
    // Создаем сетевой запрос
    this.network = new Lampa.Reguest();
    this.discovery = false;

    // Главный метод
    this.main = function () {
        var owner = this;
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var onComplete = arguments.length > 1 ? arguments[1] : undefined;
        var onError = arguments.length > 2 ? arguments[2] : undefined;
        var partsLimit = 6;

        // Опции сортировки
        var sortOptions = [
            { key: 'vote_count.desc', title: 'Много голосов' },
            { key: 'vote_average.desc', title: 'Высокий рейтинг' },
            { key: 'first_air_date.desc', title: 'Новинки' },
            { key: 'popularity.desc', title: 'Популярные' },
            { key: 'revenue.desc', title: 'Интерес зрителей' }
        ];

        // Жанры фильмов
        var genres = [
            { id: 28, title: 'боевики' },
            { id: 35, title: 'комедии' },
            { id: 18, title: 'драмы' },
            { id: 10749, title: 'мелодрамы' },
            { id: 16, title: 'мультфильмы' },
            { id: 12, title: 'приключения' },
            { id: 80, title: 'криминал' },
            { id: 9648, title: 'детективы' },
            { id: 878, title: 'фантастика' },
            { id: 14, title: 'фэнтези' },
            { id: 10752, title: 'военные' },
            { id: 37, title: 'вестерны' },
            { id: 53, title: 'триллеры' },
            { id: 10751, title: 'семейные' }
        ];

        // Стриминговые сервисы
        var streamingServices = [
            { id: 49, title: 'HBO' },
            { id: 2552, title: 'Apple TV+' },
            { id: 453, title: 'Hulu' },
            { id: 1024, title: 'Amazon Prime' },
            { id: 213, title: 'Netflix' },
            { id: 2493, title: 'Start' },
            { id: 2859, title: 'Premier' },
            { id: 4085, title: 'KION' },
            { id: 3923, title: 'ИВИ' },
            { id: 3871, title: 'Okko' },
            { id: 3827, title: 'Кинопоиск' },
            { id: 5806, title: 'Wink' },
            { id: 806, title: 'СТС' },
            { id: 1191, title: 'ТНТ' },
            { id: 3186, title: 'HBO Max' },
            { id: 2076, title: 'Paramount+' },
            { id: 3353, title: 'Peacock' },
            

        ];
        


        // Перемешивание массива
        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }
function adjustSortForMovies(sort) {
            if (sort.key === 'first_air_date.desc') {
                return { key: 'release_date.desc', title: 'Новинки' };
            }
            return sort;
        }

      
        // Запрос с жанром и сервисом
        function getStreamingWithGenres(serviceName, serviceId) {
            return function (callback) {
                var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
                var genre = genres[Math.floor(Math.random() * genres.length)];
                owner.get(
                    'discover/tv?with_networks=' + serviceId +
                    '&with_genres=' + genre.id +
                    '&sort_by=' + sort.key +
                    '&air_date.lte=' + new Date().toISOString().substr(0, 10),
                    params,
                    function (json) {
                        json.title = Lampa.Lang.translate(sort.title + ' (' + genre.title + ') на ' + serviceName);
                        callback(json);
                    },
                    callback
                );
            };
        }

        // Запрос только с сервисом
function getStreaming(serviceName, serviceId) {
    return function (callback) {
        var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
        owner.get(
            'discover/tv?with_networks=' + serviceId +
            '&sort_by=' + sort.key +
            '&air_date.lte=' + new Date().toISOString().substr(0, 10),
            params,
            function (json) {
                if (json.results) {
                    json.results = json.results.filter(function (tvShow) {
                        return tvShow.name && /[а-яА-ЯёЁ]/.test(tvShow.name);
                    });
                }

                json.title = Lampa.Lang.translate(sort.title + ' на ' + serviceName);
                callback(json);
            },
            callback
        );
    };
}

        // Основные данные
        var partsData = [
            function (callback) {
                owner.get('movie/now_playing', params, function (json) {
                    json.title = Lampa.Lang.translate('Сейчас смотрят');
                    callback(json);
                }, callback);
            },
            function (callback) {
                owner.get('trending/movie/week', params, function (json) {
                    json.title = Lampa.Lang.translate('Популярные фильмы');
                    callback(json);
                }, callback);
            },
            function (callback) {
                owner.get('trending/tv/week', params, function (json) {
                    json.title = Lampa.Lang.translate('Популярные сериалы');
                    callback(json);
                }, callback);
            }
        ];

        // Добавляем запросы для стриминговых сервисов
        streamingServices.forEach(function (service) {
            partsData.push(getStreaming(service.title, service.id));
            partsData.push(getStreamingWithGenres(service.title, service.id));
        });

        // Добавляем запросы для жанров
        genres.forEach(function (genre) {
    partsData.push(function (callback) {
        var sort = adjustSortForMovies(sortOptions[Math.floor(Math.random() * sortOptions.length)]);
        var apiUrl = 'discover/movie?with_genres=' + genre.id + '&sort_by=' + sort.key + 
                     '&vote_count.gte=100';

        if (sort.key === 'release_date.desc') {
            var endDate = new Date().toISOString().split('T')[0]; // Сегодняшняя дата
            var startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1); // Берем релизы за последний год
            startDate = startDate.toISOString().split('T')[0];

            apiUrl += '&release_date.gte=' + startDate + '&release_date.lte=' + endDate;
        }

        owner.get(apiUrl, params, function (json) {
            if (json.results) {
                json.results = json.results.filter(function (movie) {
                    return movie.title && /[а-яА-ЯёЁ]/.test(movie.title); // Фильтруем по наличию русского названия
                });
            }

            json.title = Lampa.Lang.translate(sort.title + ' (' + genre.title + ')');
            callback(json);
        }, callback);
    });
});


        // Запрос для ближайших эпизодов
        var upcomingEpisodesRequest = function (callback) {
            callback({
                source: 'tmdb',
                results: Lampa.TimeTable.lately().slice(0, 20),
                title: Lampa.Lang.translate('title_upcoming_episodes'),
                nomore: true,
                cardClass: function (_elem, _params) {
                    return new Episode(_elem, _params);
                }
            });
        };
        

function getRussianMoviesByGenre(genre) {
            return function (callback) {
                var sort = adjustSortForMovies(sortOptions[Math.floor(Math.random() * sortOptions.length)]);
                var apiUrl = 'discover/movie?with_original_language=ru&with_genres=' + genre.id + '&sort_by=' + sort.key;

                if (sort.key === 'release_date.desc') {
                    var today = new Date().toISOString().split('T')[0];
                    apiUrl += '&release_date.lte=' + today;
                    apiUrl += '&region=RU';
                }

                owner.get(apiUrl, params, function (json) {
                    json.title = Lampa.Lang.translate(sort.title + ' - российские (' + genre.title + ')');
                    callback(json);
                }, callback);
            };
        }
        

        function getRussianTVByGenre(genre) {
            return function (callback) {
                var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
                owner.get(
                    'discover/tv?with_origin_country=RU&with_genres=' + genre.id + '&sort_by=' + sort.key,
                    params,
                    function (json) {
                        json.title = Lampa.Lang.translate(sort.title + ' - российские сериалы (' + genre.title +')');
                        callback(json);
                    },
                    callback
                );
            };
        }

        function getPopularRussianTV(callback) {
            owner.get('discover/tv?with_origin_country=RU&sort_by=vote_average.desc', params, function (json) {
                json.title = Lampa.Lang.translate('Российские сериалы с высоким рейтингом');
                callback(json);
            }, callback);
        }

        function getPopularRussianMovies(callback) {
            owner.get('discover/movie?sort_by=popularity.desc&with_origin_country=RU', params, function (json) {
                json.title = Lampa.Lang.translate('Интерес зрителей (российские фильмы)');
                callback(json);
            }, callback);
        }


// Добавляем новые подборки в список запросов

partsData.push(getPopularRussianTV);
        partsData.push(getPopularRussianMovies);

        genres.forEach(function (genre) {
            partsData.push(getRussianMoviesByGenre(genre));
            partsData.push(getRussianTVByGenre(genre));
        });
        

function getBestMoviesByGenre(genre) {
    return function (callback) {
        var apiUrl = 'discover/movie?with_genres=' + genre.id + 
                     '&sort_by=vote_average.desc' + 
                     '&vote_count.gte=50';

        owner.get(apiUrl, params, function (json) {
            if (json.results) {
                json.results = json.results.filter(function (movie) {
                    return movie.title && /[а-яА-ЯёЁ]/.test(movie.title);
                });
            }

            json.title = Lampa.Lang.translate('Лучшие фильмы (' + genre.title + ')');
            callback(json);
        }, callback);
    };
}

function getBestTVShowsByGenre(genre) {
    return function (callback) {
        var apiUrl = 'discover/tv?with_genres=' + genre.id + 
                     '&sort_by=vote_average.desc' + 
                     '&vote_count.gte=500';

        owner.get(apiUrl, params, function (json) {
            if (json.results) {
                json.results = json.results.filter(function (tvShow) {
                    return tvShow.name && /[а-яА-ЯёЁ]/.test(tvShow.name);
                });
            }

            json.title = Lampa.Lang.translate('Лучшие сериалы (' + genre.title + ')');
            callback(json);
        }, callback);
    };
}

genres.forEach(function (genre) {
    partsData.push(getBestMoviesByGenre(genre));
    partsData.push(getBestTVShowsByGenre(genre));
});


//подборки по годам
function getBestMoviesByGenreAndPeriod(genre, startYear, endYear) {
    return function (callback) {
        var apiUrl = 'discover/movie?with_genres=' + genre.id + 
                     '&sort_by=vote_average.desc' + 
                     '&vote_count.gte=1000' +
                     '&primary_release_date.gte=' + startYear + '-01-01' +
                     '&primary_release_date.lte=' + endYear + '-12-31';

        owner.get(apiUrl, params, function (json) {
            if (json.results) {
                json.results = json.results.filter(function (movie) {
                    return movie.title && /[а-яА-ЯёЁ]/.test(movie.title) &&
                           movie.release_date &&
                           parseInt(movie.release_date.substring(0, 4)) >= startYear &&
                           parseInt(movie.release_date.substring(0, 4)) <= endYear;
                });
            }

            json.title = Lampa.Lang.translate('Лучшие фильмы (' + genre.title + ') за ' + startYear + '-' + endYear);
            callback(json);
        }, callback);
    };
}

function getBestTVShowsByGenreAndPeriod(genre, startYear, endYear) {
    return function (callback) {
        var apiUrl = 'discover/tv?with_genres=' + genre.id + 
                     '&sort_by=vote_average.desc' + 
                     '&vote_count.gte=1000' +
                     '&first_air_date.gte=' + startYear + '-01-01' +
                     '&first_air_date.lte=' + endYear + '-12-31';

        owner.get(apiUrl, params, function (json) {
            if (json.results) {
                json.results = json.results.filter(function (tvShow) {
                    return tvShow.name && /[а-яА-ЯёЁ]/.test(tvShow.name) &&
                           tvShow.first_air_date &&
                           parseInt(tvShow.first_air_date.substring(0, 4)) >= startYear &&
                           parseInt(tvShow.first_air_date.substring(0, 4)) <= endYear;
                });
            }

            json.title = Lampa.Lang.translate('Лучшие сериалы (' + genre.title + ') за ' + startYear + '-' + endYear);
            callback(json);
        }, callback);
    };
}

// Создаем временные периоды (по 5 лет)
var periods = [
    { start: 1995, end: 2000 },
    { start: 2000, end: 2005 },
    { start: 2006, end: 2010 },
    { start: 2011, end: 2015 },
    { start: 2016, end: 2020 },
    { start: 2021, end: 2025}
];

// Функция для выбора 1 случайного периода
function getRandomPeriods() {
    var copy = periods.slice(); 
    var selected = [];

    while (selected.length < 1) {
        var index = Math.floor(Math.random() * copy.length);
        selected.push(copy.splice(index, 1)[0]); // 
    }

    return selected;
}

var selectedPeriods = getRandomPeriods();

selectedPeriods.forEach(function (period) {
    genres.forEach(function (genre) {
        partsData.push(getBestMoviesByGenreAndPeriod(genre, period.start, period.end));
        partsData.push(getBestTVShowsByGenreAndPeriod(genre, period.start, period.end));
    });
});


function randomWideFlag() {
    return Math.random() < 0.2; 
}

function wrapWithWideFlag(requestFunc) {
    return function (callback) {
        requestFunc(function (json) {
            if (randomWideFlag()) {
                json.small = true;
                json.wide = true;

                if (Array.isArray(json.results)) { 
                    json.results.forEach(function (card) {
                        card.promo = card.overview;
                        card.promo_title = card.title || card.name;
                    });
                }
            }
            callback(json);
        });
    };
}

partsData = partsData.map(wrapWithWideFlag);


shuffleArray(partsData);
partsData.splice(4, 0, upcomingEpisodesRequest); 
shuffleArray(partsData); 
//partsData.unshift(getDonate);

        // Загрузка частей данных
        function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(partsData, partsLimit, partLoaded, partEmpty);
        }

        loadPart(onComplete, onError);
        return loadPart;
    };
};






/* для детей */



var SourceTMDBkids = function (parent) {
    this.network = new Lampa.Reguest();
    this.discovery = false;

    // Переменная для ограничения рейтинга
    var ratingLimit = 'PG'; // Можно поменять на любой нужный рейтинг, например, 'PG', 'G', 'R'

    this.main = function () {
        var owner = this;
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var onComplete = arguments.length > 1 ? arguments[1] : undefined;
        var onError = arguments.length > 2 ? arguments[2] : undefined;
        var partsLimit = 6;

        var sortOptions = [
            { key: 'vote_count.desc', title: 'Много голосов' },
            { key: 'first_air_date.desc', title: 'Новинки' },
            { key: 'popularity.desc', title: 'Популярные' },
            { key: 'revenue.desc', title: 'Интерес зрителей' }
        ];

        var kidsGenres = [
            { id: 16, title: 'мультфильмы' },
            { id: 10751, title: 'семейные' },
            { id: 14, title: 'фэнтези' },
            { id: 28, title: 'боевики' },
            { id: 35, title: 'комедии' },
            { id: 12, title: 'приключения' },
            { id: 878, title: 'фантастика' },
            { id: 14, title: 'фэнтези' },
            { id: 10751, title: 'семейные' }
        ];

        var forKids = [
            { id: 101, title: 'Lego' },
            { id: 102, title: 'Том и джерри' },
            { id: 103, title: 'Микки маус' },
       
        ];

        var streamingServices = [
            { id: 49, title: 'HBO' },
            { id: 2552, title: 'Apple TV+' },
            { id: 453, title: 'Hulu' },
            { id: 1024, title: 'Amazon Prime' },
            { id: 213, title: 'Netflix' },
            { id: 2493, title: 'Start' },
            { id: 2859, title: 'Premier' },
            { id: 4085, title: 'KION' },
            { id: 3923, title: 'ИВИ' },
            { id: 3871, title: 'Okko' },
            { id: 3827, title: 'Кинопоиск' },
            { id: 5806, title: 'Wink' },
            { id: 806, title: 'СТС' },
            { id: 1191, title: 'ТНТ' },
            { id: 3186, title: 'HBO Max' },
            { id: 2076, title: 'Paramount+' },
            { id: 3353, title: 'Peacock' }
        ];

        var kidsStudios = [
            { id: 2, title: 'Disney' },
            { id: 3, title: 'Pixar' },
            { id: 521, title: 'DreamWorks Animation' },
            { id: 9383, title: 'Blue Sky Studios' },
            { id: 6704, title: 'Illumination Entertainment' }
        ];

        // Изменяем рейтинг на переменную для удобства редактирования
        var ratingFilter = 'certification_country=US&certification.lte=' + ratingLimit;

        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function createRequest(endpoint, titleSuffix, callback) {
            var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
            owner.get(endpoint + '&sort_by=' + sort.key + '&' + ratingFilter, params, function (json) {
                json.title = Lampa.Lang.translate(sort.title + ' ' + titleSuffix);


                callback(json);
            }, callback);
        }

        function getStreaming(serviceName, serviceId) {
            return function (callback) {
                createRequest(
                    'discover/tv?with_networks=' + serviceId + '&with_genres=16,10751',
                    'на ' + serviceName,
                    callback
                );
            };
        }

        function getStudioMovies(studioName, studioId) {
            return function (callback) {
                var endpoint = 'discover/movie?with_companies=' + studioId;
                createRequest(endpoint, 'от студии ' + studioName, function (json) {
                    callback(json);
                });
            };
        }

        // Новый запрос для фильмов без жанра, но с сортировкой и рейтингом
        function getMoviesWithoutGenre() {
            return function (callback) {
                createRequest(
                    'discover/movie?' + ratingFilter,
                    'Фильмы',
                    callback
                );
            };
        }
        
        
function searchByKeyword() {
            return function (callback) {
                forKids.forEach(function (keyword) {
                    var endpoint = 'search/movie?query=' + encodeURIComponent(keyword.title);
                    createRequest(endpoint, '(' + keyword.title + ')', callback);
                });
            };
        }

    
        var partsData = [
            function (callback) {
                createRequest('discover/movie?with_genres=10751,16&with_original_language=ru', 'русские мультфильмы', callback);
            },
            function (callback) {
                createRequest('discover/movie?with_genres=10751,16&with_original_language=uk|en|be|zh|cn', 'иностранные мультфильмы', callback);
            }
        ];

        streamingServices.forEach(function (service) {
            partsData.push(getStreaming(service.title, service.id));
        });

        kidsGenres.forEach(function (genre) {
            partsData.push(function (callback) {
                createRequest('discover/movie?with_genres=' + genre.id, '(' + genre.title + ')', callback);
            });
        });

        kidsStudios.forEach(function (studio) {
            partsData.push(getStudioMovies(studio.title, studio.id));
        });
        
    function randomWideFlag() {
    return Math.random() < 0.2; 
}

function wrapWithWideFlag(requestFunc) {
    return function (callback) {
        requestFunc(function (json) {
            if (randomWideFlag()) {
                json.small = true;
                json.wide = true;

                if (Array.isArray(json.results)) { 
                    json.results.forEach(function (card) {
                        card.promo = card.overview;
                        card.promo_title = card.title || card.name;
                    });
                }
            }
            callback(json);
        });
    };
}

        partsData = partsData.map(wrapWithWideFlag);

        partsData.push(searchByKeyword());
        partsData.push(getMoviesWithoutGenre());

        shuffleArray(partsData);

        function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(partsData, partsLimit, partLoaded, partEmpty);
        }

        loadPart(onComplete, onError);
        return loadPart;
    };
};



/*Профиль, где в основном российское*/
var SourceTMDBrus = function (parent) {
    // Создаем сетевой запрос
    this.network = new Lampa.Reguest();
    this.discovery = false;

    // Главный метод
    this.main = function () {
        var owner = this;
        var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var onComplete = arguments.length > 1 ? arguments[1] : undefined;
        var onError = arguments.length > 2 ? arguments[2] : undefined;
        var partsLimit = 6;

        // Опции сортировки
        var sortOptions = [
            { key: 'vote_count.desc', title: 'Много голосов' },
            //{ key: 'vote_average.desc', title: 'Высокий рейтинг' },
             { key: 'first_air_date.desc', title: 'Новинки' },
            
            { key: 'popularity.desc', title: 'Популярные' },
            { key: 'revenue.desc', title: 'Интерес зрителей' }
        ];

        // Жанры фильмов
        var genres = [
            { id: 28, title: 'боевики' },
            { id: 35, title: 'комедии' },
            { id: 18, title: 'драмы' },
            { id: 10749, title: 'мелодрамы' },
            { id: 16, title: 'мультфильмы' },
            { id: 12, title: 'приключения' },
            { id: 80, title: 'криминал' },
            { id: 9648, title: 'детективы' },
            { id: 878, title: 'фантастика' },
            { id: 14, title: 'фэнтези' },
            { id: 10752, title: 'военные' },
            { id: 37, title: 'вестерны' },
            { id: 53, title: 'триллеры' },
            { id: 10751, title: 'семейные' }
        ];

        // Стриминговые сервисы
        var streamingServices = [
            { id: 2493, title: 'Start' },
            { id: 2859, title: 'Premier' },
            { id: 4085, title: 'KION' },
            { id: 3923, title: 'ИВИ' },
            { id: 3871, title: 'Okko' },
            { id: 3827, title: 'Кинопоиск' },
            { id: 5806, title: 'Wink' },
            { id: 806, title: 'СТС' },
            { id: 1191, title: 'ТНТ' },
        ];

        // Перемешивание массива
        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }

        // Запрос с жанром и сервисом
        function getStreamingWithGenres(serviceName, serviceId) {
            return function (callback) {
                var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
                var genre = genres[Math.floor(Math.random() * genres.length)];
                owner.get(
                    'discover/tv?with_networks=' + serviceId +
                    '&with_genres=' + genre.id +
                    '&sort_by=' + sort.key +
                    '&air_date.lte=' + new Date().toISOString().substr(0, 10),
                    params,
                    function (json) {
                        json.title = Lampa.Lang.translate(sort.title + ' (' + genre.title + ') на ' + serviceName);
                        callback(json);
                    },
                    callback
                );
            };
        }

        // Запрос только с сервисом
        function getStreaming(serviceName, serviceId) {
            return function (callback) {
                var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
                owner.get(
                    'discover/tv?with_networks=' + serviceId +
                    '&sort_by=' + sort.key +
                    '&air_date.lte=' + new Date().toISOString().substr(0, 10),
                    params,
                    function (json) {
                        json.title = Lampa.Lang.translate(sort.title + ' на ' + serviceName);
                        callback(json);
                    },
                    callback
                );
            };
        }

        // Основные данные
        var partsData = [
            function (callback) {
                owner.get('movie/now_playing', params, function (json) {
                    json.title = Lampa.Lang.translate('Сейчас смотрят');
                    callback(json);
                }, callback);
            },
            function (callback) {
                owner.get('trending/movie/week', params, function (json) {
                    json.title = Lampa.Lang.translate('Популярные фильмы');
                    callback(json);
                }, callback);
            },
            function (callback) {
                owner.get('trending/tv/week', params, function (json) {
                    json.title = Lampa.Lang.translate('Популярные сериалы');
                    callback(json);
                }, callback);
            },
        ];

        // Добавляем запросы для стриминговых сервисов
        streamingServices.forEach(function (service) {
            partsData.push(getStreaming(service.title, service.id));
            partsData.push(getStreamingWithGenres(service.title, service.id));
        });


        // Запрос для ближайших эпизодов
        var upcomingEpisodesRequest = function (callback) {
            callback({
                source: 'tmdb',
                results: Lampa.TimeTable.lately().slice(0, 20),
                title: Lampa.Lang.translate('title_upcoming_episodes'),
                nomore: true,
                cardClass: function (_elem, _params) {
                    return new Episode(_elem, _params);
                }
            });
        };
        


function getRussianMoviesByGenre(genre) {
    return function (callback) {
        var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

        if (sort.key === 'first_air_date.desc') {
            sort.key = 'release_date.desc';
        }

        var apiUrl = 'discover/movie?with_original_language=ru&with_genres=' + genre.id + '&sort_by=' + sort.key;

        if (sort.key === 'release_date.desc') {
            var today = new Date().toISOString().split('T')[0]; 
            apiUrl += '&release_date.lte=' + today;
            apiUrl += '&region=RU'; 
        }

        owner.get(
            apiUrl,
            params,
            function (json) {
                json.title = Lampa.Lang.translate(sort.title + ' (российские ' + genre.title + ')');
                callback(json); 
            },
            callback
        );
    };
}

        function getRussianTVByGenre(genre) {
            return function (callback) {
                var sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
                owner.get(
                    'discover/tv?with_original_language=ru&with_genres=' + genre.id + '&sort_by=' + sort.key,
                    params,
                    function (json) {
                        json.title = Lampa.Lang.translate(sort.title + ' (российские ' + genre.title + ' сериалы)');
                        callback(json);
                    },
                    callback
                );
            };
        }

        function getPopularRussianTV(callback) {
            owner.get('discover/tv?with_original_language=ru&sort_by=vote_average.desc', params, function (json) {
                json.title = Lampa.Lang.translate('Российские сериалы с высоким рейтингом');
                callback(json);
            }, callback);
        }

        function getPopularRussianMovies(callback) {
            owner.get('discover/movie?sort_by=popularity.desc&with_original_language=ru', params, function (json) {
                json.title = Lampa.Lang.translate('Интерес зрителей (российские фильмы)');
                callback(json);
            }, callback);
        }


// Добавляем новые подборки в список запросов

partsData.push(getPopularRussianTV);
        partsData.push(getPopularRussianMovies);

        genres.forEach(function (genre) {
            partsData.push(getRussianMoviesByGenre(genre));
            partsData.push(getRussianTVByGenre(genre));
        });

function randomWideFlag() {
    return Math.random() < 0.2; 
}

function wrapWithWideFlag(requestFunc) {
    return function (callback) {
        requestFunc(function (json) {
            if (randomWideFlag()) {
                json.small = true;
                json.wide = true;

                if (Array.isArray(json.results)) { 
                    json.results.forEach(function (card) {
                        card.promo = card.overview;
                        card.promo_title = card.title || card.name;
                    });
                }
            }
            callback(json);
        });
    };
}

partsData = partsData.map(wrapWithWideFlag);

        // Перемешиваем массив данных
        shuffleArray(partsData);
        partsData.splice(4, 0, upcomingEpisodesRequest); 
        shuffleArray(partsData); // Снова перемешиваем

        // Загрузка частей данных
        function loadPart(partLoaded, partEmpty) {
            Lampa.Api.partNext(partsData, partsLimit, partLoaded, partEmpty);
        }

        loadPart(onComplete, onError);
        return loadPart;
    };
};



function add() {
    // Создаем три отдельных источника
    var tmdb_mod = Object.assign({}, Lampa.Api.sources.tmdb, new SourceTMDB(Lampa.Api.sources.tmdb));


    Lampa.Api.sources.tmdb_mod = tmdb_mod;


    Object.defineProperty(Lampa.Api.sources, 'NNMTV', {
        get: function() {
            return tmdb_mod;
        }
    });

    // Добавляем три источника в меню
    Lampa.Params.select('source', Object.assign({}, Lampa.Params.values['source'], {
        'NNMTV': 'NNMTV'
    }), 'tmdb');
}


function startProfileListener() {
    Lampa.Listener.follow('profile', function(event) {
        if (event.type !== 'changed') return;

        if (event.params.adult) {
            if (event.params.rus) {
                changeSource('NNMTV', true);
            }
        }
    });


    Lampa.Storage.listener.follow('change', function(event) {
        if (event.name === "source" && !sourceChangedByProfile) {
            if (event.value === 'NNMTV') {
                softRefresh(event.value, true); 
               
            }
        }
    });
}

// Флаг для предотвращения рекурсивных вызовов
var sourceChangedByProfile = false;

function changeSource(newSource, isProfileChanged) {
    if (typeof isProfileChanged === 'undefined') {
        isProfileChanged = false;
    }

    var currentSource = Lampa.Storage.get('source');

    if (currentSource !== newSource) {
        sourceChangedByProfile = true; // Фиксируем, что source меняется от профиля
        Lampa.Storage.set('source', newSource);

        setTimeout(function() {
            softRefresh(newSource, false); // Сразу обновляем без проверки
            sourceChangedByProfile = false; // Сбрасываем флаг
        }, 10);
    }
}

function softRefresh(source, isFromSourceChange) {
    Lampa.Activity.push({
        title: source.toUpperCase(),
        component: 'main',
        source: source
    });

    if (isFromSourceChange) {
        setTimeout(function() {
            Lampa.Controller.toggle('settings');
        }, 100);
    }
}

// Запуск слушателя
startProfileListener();


if (window.appready) add(); else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') { add(); }
        });
      }
    }

    if (!window.plugin_tmdb_mod_ready) startPlugin();


})( );
