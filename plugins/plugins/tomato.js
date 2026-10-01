(function () {
    'use strict';

    function main$7() {
      Lampa.Lang.add({
        lme_ratings_desc: {
          ru: "Добавляет дополнительные рейтинги",
          en: "Adds additional ratings",
          uk: "Додає додаткові рейтинги"
        }
      });
    }
    var Lang = {
      main: main$7
    };

   
    function main() {
      Lampa.Listener.follow("full", function (e) {
        var cardData = e.object;
        console.log('cardData.type', e.type);
        if (e.type == "complite") {
          var settings = {
            url: "https://api.mdblist.com/tmdb/".concat(cardData.method == 'tv' ? 'show' : cardData.method, "/").concat(cardData.id, "?apikey=fec7386qzqidavmui3wq5pijf"),
            method: "GET",
            timeout: 0
          };
          $.ajax(settings).done(function (response) {
            console.log(response);
            var ratings = response.ratings;
            var validRatings = ratings.filter(function (rating) {
              if (cardData.source === 'cub') {
                return rating.value !== null && rating.source !== 'tmdb' && rating.source !== 'imdb';
              }
              return rating.value !== null && rating.source !== 'tmdb';
            });
            var rateLine = $(".full-start-new__rate-line");
            rateLine.css({
              'display': 'flex',
              'flex-wrap': 'wrap',
              'gap': '10px'
            });
            validRatings.forEach(function (rating) {
			  if(rating.source != "tomatoes") return;
              var rateElement = $("\n                    <div class=\"full-start__rate rate--".concat(rating.source, "\">\n                        <div>").concat(rating.value, "</div>\n                        <div class=\"source--name\">").concat(rating.source.toUpperCase(), "</div>\n                    </div>\n                "));
              rateLine.prepend(rateElement);
            });
          });
        }
      });
    }
    var ratings = {
      main: main
    };

    var manifest = {
      type: "other",
      version: "0.0.4",
      author: '@lme_chat',
      name: "Lampa Movie Enhancer",
      description: "Some tweaks for movie content",
      component: "lme"
    };
    function add() {
      Lang.main();
      Lampa.Manifest.plugins = manifest;
      ratings.main();
    }
	
	 var VISIBLE_NETWORKS_LIMIT = 1;

    function addLocalization() {
        Lampa.Lang.add({
            tmdb_networks: {
                'en': 'Networks',
                'uk': 'Мережі',
                'ru': 'Сети',
            },
            tmdb_networks_open: {
                'en': 'Open',
                'uk': 'Відкрити',
                'ru': 'Открыть',
            },
            tmdb_networks_top: {
                'en': 'Top',
                'uk': 'Популярні',
                'ru': 'Популярные'
            },
            tmdb_networks_new: {
                'en': 'New',
                'uk': 'Новинки',
                'ru': 'Новинки',
            },
        });
    }

    function createNetworkButton(network, index) {
        var networkBtn = $('<div class="full-descr__tag selector network-btn"></div>');

        if (network.logo_path) {
            networkBtn.css('background-color', '#fff');
            var logo = $('<img/>').attr({
                src: Lampa.TMDB.image("t/p/w300" + network.logo_path),
                alt: network.name,
                height: 24
            }).css('background-color', '#fff');
            networkBtn.append(logo);
        } else {
            networkBtn.text(network.name);
        }

        if (index >= VISIBLE_NETWORKS_LIMIT) {
            networkBtn.addClass('hide');
        }

        networkBtn.on('hover:enter', function () {
            onNetworkButtonClick(network);
        });

        return networkBtn;
    }

    function createMoreButton(hiddenCount) {
        var moreBtn = $(
            '<div style="max-height: 45px;" class="full-descr__tag tag-count selector">' +
                '<div class="tag-count__name">' + Lampa.Lang.translate('more') + '</div>' +
                '<div class="tag-count__count">' + hiddenCount + '</div>' +
            '</div>'
        );

        moreBtn.on('hover:enter', function () {
            $(this).addClass('hide');
            $('.network-btn.hide').removeClass('hide');
        });

        return moreBtn;
    }

    function renderNetworks(movie) {
        $('.network-line').remove();
        if (!movie || movie.source !== 'tmdb' || !movie.networks || !movie.networks.length) return;

        var networksLine = $(
            '<div style="margin-left: 10px;" class="selector network-line">' +
                        '<div style="margin: -0.9em;" class="full-descr__line-body"></div>' +
            '</div>'
        );
        var container = $('.full-descr__line-body', networksLine);

        movie.networks.forEach(function (network, index) {
            container.append(createNetworkButton(network, index, movie.networks.length));
        });

        $('.button--options').after(networksLine);
    }

    function onNetworkButtonClick(network) {
        var enabled = Lampa.Controller.enabled().name;
        var menu = [
            {
                title: Lampa.Lang.translate('tmdb_networks_open') + ' ' + Lampa.Lang.translate('tmdb_networks_top').toLowerCase(),
                sort_by: '',
                type: Lampa.Lang.translate('tmdb_networks_top')
            },
            {
                title: Lampa.Lang.translate('tmdb_networks_open') + ' ' + Lampa.Lang.translate('tmdb_networks_new').toLowerCase(),
                sort_by: 'first_air_date.desc',
                type: Lampa.Lang.translate('tmdb_networks_new')
            }
        ];

        Lampa.Select.show({
            title: network.name,
            items: menu,
            onBack: function () {
                Lampa.Controller.toggle(enabled);
            },
            onSelect: function (action) {
                Lampa.Activity.push({
                    url: 'discover/tv',
                    title: action.type + ' ' + network.name,
                    component: 'category_full',
                    networks: network.id,
                    sort_by: action.sort_by,
                    source: 'tmdb',
                    card_type: true,
                    page: 1
                });
            }
        });
    }
    function startPlugin() {
      if (window.appready) add();else {
        Lampa.Listener.follow("app", function (e) {
          if (e.type === "ready") add();
        });
      }
	      
	}
	  if (!window.plugin_tomato_ready) startPlugin();
	  window.plugin_tomato_ready = true;
	  	 
		 
	    if (window.tmdb_networks) {
            return;
        }
		window.tmdb_networks = true;
		addLocalization();		
        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'archive' && e.object) {
                renderNetworks(e.object.card);
            }
        });
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite' && (e.object.method === 'tv' || e.object.method === 'movie')) {
                renderNetworks(e.data.movie);
            }
        });


})();