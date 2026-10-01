(function() {
  var updateplugi = false;
  var pluginss = Lampa.Storage.get('plugins', '[]')
  pluginss.forEach(function(plug) {
    if (plug.url.indexOf('cub.red') >= 0) {
      updateplugi = true;
	  plug.url = (plug.url + '').replace('cub.red/', 'cub.rip/');
    }
  });
  if (updateplugi)
    Lampa.Storage.set('plugins', pluginss);
})();