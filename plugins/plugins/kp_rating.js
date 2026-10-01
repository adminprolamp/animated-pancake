(function () {
    'use strict';
    var network = new Lampa.Reguest();
    var buttonTrailersIcon = '<svg class="button--kinopoisk_trailers_icon" width="239" height="239" viewBox="0 0 239 239" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"><path fill="currentColor" d="M215 121.415l-99.297-6.644 90.943 36.334a106.416 106.416 0 0 0 8.354-29.69z" /><path fill="currentColor" d="M194.608 171.609C174.933 197.942 143.441 215 107.948 215 48.33 215 0 166.871 0 107.5 0 48.13 48.33 0 107.948 0c35.559 0 67.102 17.122 86.77 43.539l-90.181 48.07L162.57 32.25h-32.169L90.892 86.862V32.25H64.77v150.5h26.123v-54.524l39.509 54.524h32.169l-56.526-57.493 88.564 46.352z" /><path d="M206.646 63.895l-90.308 36.076L215 93.583a106.396 106.396 0 0 0-8.354-29.688z" fill="currentColor"/></svg>';
    function getColorBasedOnRate(rate) {
        if (rate >= 1 && rate <= 4) {
            return '#EA4E4E';
        } else if (rate >= 5 && rate <= 7) {
            return '#999';
        } else if (rate > 7) {
            return '#79D29E';
        }
    }
    function addReaction(data, type, add) {
        let mine = Lampa.Storage.get('mine_reactions',{})
        let id   = (data.movie.name ? 'tv' : 'movie') + '_' + data.movie.id

        if(!mine[id]) mine[id] = []

        let ready = mine[id].indexOf(type) >= 0 

        if(add){
            if(!ready) mine[id].push(type)
            Lampa.Storage.set('mine_reactions',mine)
        }

        return ready
    }  
    function displayTrailers(kinopoiskId, oauth) {
		var button = "<div class=\"full-start__button selector button--kinopoisk_trailers\">\n        "+buttonTrailersIcon+"\n\n        <span>Трейлеры Кинопоиск</span>\n    </div>";
        if (kinopoiskId) {
            console.log('Kinopoisk Ratings', 'Getting trailers for movie ' + String(kinopoiskId) + '...');
            network.silent('https://script.google.com/macros/s/AKfycbwqmWyAH66dliw2EfEkvnnhlhEnXHwAwD6v2oBoV4oXtKyYy2wLat4kTVg_6K54rgk6/exec?method=getTrailers&oauth=' + oauth + '&movie=' + String(kinopoiskId),
                function (data) { // on success
                    if (data && data.data && data.data.movie && data.data.movie.trailers && data.data.movie.trailers.total > 0) {
                        console.log('Kinopoisk Ratings', 'Movie ' + String(kinopoiskId) + ' trailers received, count ' + String(data.data.movie.trailers.total));
                        var trailers = data.data.movie.trailers.items;
                        var kinopoisk_trailers = [];
                        for (var i = 0; i < trailers.length; i++) {
                            kinopoisk_trailers.push({
                                title: trailers[i].title,
                                url: 'http://cors.byskaz.ru/'+trailers[i].streamUrl,
                                date: trailers[i].createdAt,
                                icon: 'http:' + trailers[i].preview.avatarsUrl + '/280x178',
                            });
                            
                        }
                        
    
	if (kinopoisk_trailers.length > 0 && $('.button--kinopoisk_trailers').length === 0) {
	function addButton(e) {
      if (e.render.find('.button--kinopoisk_trailers').length) return;
      e.render.after(button);
    }
    try {
	if (kinopoisk_trailers.length > 0 && $('.button--kinopoisk_trailers').length === 0) {
      if (Lampa.Activity.active().component == 'full') {
        addButton({
          render: Lampa.Activity.active().activity.render().find('.view--torrent'),
          movie: Lampa.Activity.active().card
        });
      }
    }
	} catch (e) {}
	

                            $('.button--kinopoisk_trailers').on('hover:enter', function (card) {
                                
                                var trailers = [];
                                for (var i = 0; i < kinopoisk_trailers.length; i++) {
                                    var trailer = kinopoisk_trailers[i];
                                    var date = new Date(trailer.date);
                                    trailers.push({
                                        title: trailer.title,
                                        subtitle: date.getDate() + ' ' + Lampa.Lang.translate('month_'+date.getMonth()+'_e') + ' ' + date.getFullYear(),
                                        url: trailer.url,
                                        icon: '<img class="size-youtube" src="' + trailer.icon + '">',
                                        template: 'selectbox_icon'                            
                                    });
                                }

                                Lampa.Select.show({
                                    title: 'Трейлеры Кинопоиск',
                                    items: trailers,
                                    onSelect: function(a){
                                        Lampa.Player.play(a)
                                    },
                                    onBack: function(){
                                        Lampa.Controller.toggle('full_start')
                                    }
                                })                    
                            });
                        }


                    } else {
                        console.log('Kinopoisk Ratings', 'No trailers found for movie ' + String(kinopoiskId));
                    }

                },
                function (data) { // on error
                   console.log('Kinopoisk Ratings', 'Failed to get trailers for movie ' + String(kinopoiskId), data);
                }
            );
        } else {
            console.log('Kinopoisk Ratings', 'Can not get trailers for unknown kinopoisk id');
        }
    }

    function startPlugin() {
        window.kinopoisk_rating_ready = true;
        var oauth = Lampa.Storage.get('kinopoisk_access_token');
        var showTrailers = Lampa.Storage.get('kinopoisk_show_trailers', true);

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var kinopoiskId = e.data.movie.kinopoisk_id;
                var tmdbId = e.data.movie.id;

                if (!kinopoiskId) {
                    network.silent('https://api.alloha.tv/?token=04941a9a3ca3ac16e2b4327347bbc1&tmdb=' + tmdbId, 
                        function (data) { // on success
                            if (data && data.data && data.data.id_kp) {
                                kinopoiskId = data.data.id_kp;
                                if (showTrailers) displayTrailers(kinopoiskId, oauth);
                            } else {
                            }
                        },
                        function (data) { // on error
                        }
                  );
                } else {
                    
                    if (showTrailers) displayTrailers(kinopoiskId, oauth);
                }

            }

        });
    }
    if (!window.kinopoisk_rating_ready) startPlugin();
})();