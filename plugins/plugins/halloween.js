(function () {
    function pluginHalloween() {
      function add() {
        $('.head__logo-icon').css('display','none');
		$('.head__logo-halloween').removeClass('hide');
		 $('.head__logo-halloween').css('display','');
	  }
      if (window.appready) add();else {
        Lampa.Listener.follow('app', function (e) {
          if (e.type == 'ready') add();
        });
      }
    }

    if (!window.plugin_halloween_ready) pluginHalloween();

})();
