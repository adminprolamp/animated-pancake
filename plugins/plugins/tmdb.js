(function () {
    'use strict';
	Lampa.Storage.set('proxy_tmdb', 'true');
    function account(url){
      if (url.indexOf('account_email=') == -1) {
        var email = Lampa.Storage.get('account_email');
     //   if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
      }

      if (url.indexOf('uid=') == -1) {
        var uid = Lampa.Storage.get('lampac_unic_id', '');
      //  if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
      }
	  
      if (url.indexOf('token=') == -1) {
        var token = '';
        if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
      }
	  
      return url
    }

    Lampa.TMDB.image = function (url) {
      var base = Lampa.Utils.protocol() + 'image.tmdb.org/' + url;
	  if (url.includes("kinopoiskapiunofficial.tech")) {
		  return url.replace('t/p/w300/','');
	  } else 
      return Lampa.Storage.field('proxy_tmdb') ? 'http://lampa.byskaz.ru/tmdb/img/' + account(url) : base;
    };

    Lampa.TMDB.api = function (url) {
      var base = Lampa.Utils.protocol() + 'api.themoviedb.org/3/' + url;
	  if (url.includes("api.skaz.tv")  || url.includes("skaz.tv")) {
		  return url;
	  } else 
      return Lampa.Storage.field('proxy_tmdb') ? 'http://lampa.byskaz.ru/tmdb/api/3/' + account(url) : base;
    };
	
    Lampa.Settings.listener.follow('open', function (e) {
      if (e.name == 'tmdb') {
        e.body.find('[data-parent="proxy"]').remove();
      }
    });	
})();