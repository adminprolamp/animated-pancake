(function () {
	'use strict';

	var proxy = 'http://cors.byskaz.ru/';
	function cleanString(str) {
		return str.replace(/[^a-zA-Z\dа-яА-ЯёЁ]+/g, ' ').trim().toLowerCase();
	}
	function cacheRequest(movie, isTv, success, fail) {
		var context = this;
		var year = (movie.release_date || movie.first_air_date || '').toString()
			.replace(/\D+/g, '')
			.substring(0,4)
			.replace(/^([03-9]\d|1[0-8]|2[1-9]|20[3-9])\d+$/, '')
		;
		var search = movie.title || movie.name || movie.original_title || movie.original_name || '';
		var searchOrig = movie.original_title || movie.original_name || '';
		var query = cleanString([search,year,'русский трейлер', isTv ? 'сезон 1' : ''].join(' '));
		var url = proxy + 'https://rutube.ru/api/search/video/' +
			'?query=' + encodeURIComponent(query) +
			'&format=json'
		;
		var id = (isTv ? 'tv' : '') + (movie.id || (Lampa.Utils.hash(search)*1).toString(36));
		var key = 'RUTUBE_trailer_' + id;
		var data = sessionStorage.getItem(key);
		if (data) {
			data = JSON.parse(data);
			if (data[0]) typeof success === 'function' && success.apply(context, [data[1]]);
			else typeof fail === 'function' && fail.apply(context, [data[1]]);
		} else {
			var network = new Lampa.Reguest();
			network.native(
				url,
				function (data) {
					var results = [];
					if (!!data && !!data.results && !!data.results[0]) {
						var queryWord = query.split(' ');
						var cleanSearch = cleanString(search);
						if (searchOrig !== '' && search !== searchOrig )
							queryWord.push.apply(queryWord, cleanString(searchOrig).split(' '));
						console.log('TAG', queryWord);
						queryWord.push(isTv ? 'сериал' : 'фильм', 'русском', 'финальный', '4k', 'fullhd', 'ultrahd', 'ultra', 'hd', '1080p');
						var getRate = function(r){
							if (r._rate === -1) {
								r._rate = 0;
								var si = r._title.indexOf(cleanSearch);
								var rw = r._title.split(' ');
								if (si >= 0) {
									r._rate += 300;
									if (year) {
										var ow = r._title.substring(si + cleanSearch.length).trim().split(' ');
										if (ow.length && ow[0] !== year && /^(\d+|[ivx]+)$/.test(ow[0])) r._rate = -1000
										ow = rw.filter(function(w){return w.length === 4 && /^([03-9]\d|1[0-8]|2[1-9]|20[3-9])\d+$/.test(w);});
										if (ow.indexOf(year) >= 0) r._rate += 100;
										else for (si in ow) if (cleanSearch.indexOf(ow[si]) < 0) r._rate = -1000;
									}
								} else {
									r._rate = -2000;
								}
								var rf = rw.filter(function(w){return queryWord.indexOf(w) >= 0});
								var wordDiff = rw.length - rf.length;
								r._rate += rf.length * 100;
								r._rate -= wordDiff * 200;
								r._rate += r.duration > 120 ? 50 : -50; // Для тайзеров (обычно меньше 2 минут) рейтинг меньше
							}
							return r._rate;
						}
						results = data.results.filter(function(r){
							r._title = cleanString(r.title);
							r._rate = -1;
							var isTrailer = r._title.indexOf('трейлер') >= 0 || r._title.indexOf('trailer') >= 0 || r._title.indexOf('тайзер') >= 0;
							var durationOk = r.duration && r.duration < 420; // Меньше 7 минут
							return !!r.embed_url && isTrailer && durationOk
								&& !r.is_hidden && !r.is_deleted && !r.is_locked && !r.is_audio && !r.is_paid && !r.is_livestream && !r.is_adult
								&& getRate(r) > 400
							;
						}).sort(function(a,b){
							return getRate(b) - getRate(a);
						});
					}
					if (results.length) {
						sessionStorage.setItem(key, JSON.stringify([true, results, search]));
						typeof success === 'function' && success.apply(context, [results]);
					} else {
						sessionStorage.setItem(key, JSON.stringify([false, {}, search]));
						typeof fail === 'function' && fail.apply(context, [{}]);
					}
					network.clear();
					network = null;
				},
				function (data) {
					if (!proxy
						&& !window.AndroidJS
						&& !!data && 'status' in data
						&& 'readyState' in data
						&& data.status === 0
						&& data.readyState === 0
					) {
						proxy = Lampa.Storage.get('rutube_search_proxy', '') || 'https://rutube-search.root-1a7.workers.dev/';
						if (proxy.substr(-1) !== '/') proxy += '/';
						cacheRequest(movie, isTv, success, fail);
					} else {
						sessionStorage.setItem(key, JSON.stringify([false, data, search]));
						typeof fail === 'function' && fail.apply(context, [data]);
					}
					network.clear();
					network = null;
				}
			);
		}
	}
	function loadTrailers(event, success) {
		if (!event.object || !event.object.source || !event.data || !event.data.movie) return;
		var movie = event.data.movie;
		var isTv = !!event.object && !!event.object.method && event.object.method === 'tv';
		var title = movie.title || movie.name || movie.original_title || movie.original_name || '';
		if (title === '') return;
		var searchOk = function (data) {
			if (!!data[0]) {
				success(data);
			}
		};
		cacheRequest(movie, isTv, searchOk);
	}

	Lampa.Lang.add({
		rutube_trailer_trailer: {
			be: 'Трэйлер',
			bg: 'Трейлър',
			cs: 'Trailer',
			en: 'Trailer',
			he: 'טריילר',
			pt: 'Trailer',
			ru: 'Трейлер',
			uk: 'Трейлер',
			zh: '预告片'
		},
		rutube_trailer_preview: {
			be: 'Перадпрагляд',
			bg: 'Преглед',
			cs: 'Náhled',
			en: 'Preview',
			he: 'תצוגה מקדימה',
			pt: 'Pré-visualização',
			ru: 'Превью',
			uk: 'Попередній перегляд',
			zh: '预览'
		},
		rutube_trailer_rutube: {
			ru: 'Найдено на RUTUBE',
		}
	});

	function startPlugin() {
		window.rutube_trailer_plugin = true;
		var button = '<div class="full-start__button selector view--rutube_trailer hide" data-subtitle="#{rutube_trailer_rutube}">' +
			'<svg width="132" height="132" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M81.5361 62.9865H42.5386V47.5547H81.5361C83.814 47.5547 85.3979 47.9518 86.1928 48.6451C86.9877 49.3385 87.4801 50.6245 87.4801 52.5031V58.0441C87.4801 60.0234 86.9877 61.3094 86.1928 62.0028C85.3979 62.6961 83.814 62.9925 81.5361 62.9925V62.9865ZM84.2115 33.0059H26V99H42.5386V77.5294H73.0177L87.4801 99H106L90.0546 77.4287C95.9333 76.5575 98.573 74.7559 100.75 71.7869C102.927 68.8179 104.019 64.071 104.019 57.7359V52.7876C104.019 49.0303 103.621 46.0613 102.927 43.7857C102.233 41.51 101.047 39.5307 99.362 37.7528C97.5824 36.0698 95.6011 34.8845 93.2223 34.0904C90.8435 33.3971 87.8716 33 84.2115 33V33.0059Z" fill="currentColor"/><path d="M198 3.05176e-05C198 36.4508 168.451 66.0001 132 66.0001C124.589 66.0001 117.464 64.7786 110.814 62.5261C110.956 60.9577 111.019 59.3541 111.019 57.7359V52.7876C111.019 48.586 110.58 44.8824 109.623 41.7436C108.59 38.3588 106.82 35.4458 104.443 32.938L104.311 32.7988L104.172 32.667C101.64 30.2721 98.7694 28.5625 95.4389 27.4506L95.3108 27.4079L95.1812 27.3701C92.0109 26.446 88.3508 26 84.2115 26H77.2115V26.0059H71.3211C67.8964 18.0257 66 9.23434 66 3.05176e-05C66 -36.4508 95.5492 -66 132 -66C168.451 -66 198 -36.4508 198 3.05176e-05Z" fill="currentColor"/><rect x="1" y="1" width="130" height="130" stroke="currentColor" stroke-width="2"/></svg>' +
			'<span>#{rutube_trailer_trailer}</span>' +
			'</div>';
		var youtubeOff = !!document.currentScript && !!document.currentScript.src && /\?youtubeOff/i.test(document.currentScript.src);
		Lampa.Listener.follow('full', function (event) {
			if (event.type === 'complite') {
				var render = event.object.activity.render();
				var trailerBtn = render.find('.view--trailer');
				var btn = $(Lampa.Lang.translate(button));
				if (trailerBtn.length) {
					trailerBtn.before(btn);
					trailerBtn.toggleClass('hide', youtubeOff);
				} else {
					render.find('.full-start__button:last').after(btn);
				}
				loadTrailers(event, function(data){
					var url = proxy + (data[0].embed_url.replace('/play/embed/', '/api/play/options/'));
					btn.on('hover:enter', function () {
						var network = new Lampa.Reguest();
						network.native(url,
							function (cfg) {
								if (cfg.title && cfg.video_balancer) {
									Lampa.Player.play({
										title: ('RUTUBE: ' + cfg.title),
										url: (cfg.video_balancer.m3u8 || cfg.video_balancer.default),
										iptv: true
									});
								} else {
									Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_nofiles'));
									console.log('RuTube', 'error', cfg);
								}
							},
							function(){
								Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_empty'));
							}
						);
					}).removeClass('hide');
				});
			}
		});
	}
	if (!window.rutube_trailer_plugin && Lampa.Manifest.app_version=='2.2.8') startPlugin();
})();