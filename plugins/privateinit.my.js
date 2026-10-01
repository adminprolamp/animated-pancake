(function () {
    'use strict';

    var unic_id = Lampa.Storage.get('lampac_unic_id', '');
    if (!unic_id) {
       unic_id = Lampa.Utils.uid(8).toLowerCase();
       Lampa.Storage.set('lampac_unic_id', unic_id);
    }

    if (!Lampa.Storage.get('lampac_initiale','false')) {
       Lampa.Storage.set('lampac_initiale', 'true');
    }

    Lampa.Storage.set('language', 'ru');
    Lampa.Storage.set('tmdb_lang', 'ru');
    Lampa.Storage.set('source', 'SURS NEW');
    Lampa.Storage.set('online_balanser', 'vkmovie');
    Lampa.Storage.set('player_segments_ad', 'none');
    Lampa.Storage.set('player_segments_skip', 'none');

    Lampa.Storage.set('video_quality_default', '2160');
    Lampa.Storage.set('cub_domain', 'lovefilm.cc');
    Lampa.Storage.set('account_use', 'true');
    Lampa.Storage.set('full_btn_priority', '1278862995');

    Lampa.Utils.putScriptAsync(["https://app.lovefilm.cc/cubproxy.js", "https://app.lovefilm.cc/tmdbproxy.js", "https://app.lovefilm.cc/online.js", "https://app.lovefilm.cc/tracks.js", "https://app.lovefilm.cc/plugins/tvs_status.js", "https://app.lovefilm.cc/plugins/surs_select.js"], function() {});

    if (!(Lampa.Platform.is('android') || Lampa.Platform.is('apple') || Lampa.Platform.is('browser'))) {
       Lampa.Utils.putScriptAsync(["https://app.lovefilm.cc/plugins/refresh_button.js"], function() {});
    };

})();
