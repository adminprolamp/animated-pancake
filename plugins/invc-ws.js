(function() {
  'use strict';

    /* Слушать события
      document.addEventListener('lwsEvent', function(e) {
        console.log(e.detail);
		// e.detail.name
		// e.detail.data
      }); 
	*/

  function getAndroidVersion() {
  if (Lampa.Platform.is('android')) {
    try {
      var current = AndroidJS.appVersion().split('-');
      return parseInt(current.pop());
    } catch (e) {
      return 0;
    }
  } else {
    return 0;
  }
}

var hostkey = 'https://app.lovefilm.cc'.replace('http://', '').replace('https://', '');

if (!window.rch_nws || !window.rch_nws[hostkey]) {
  if (!window.rch_nws) window.rch_nws = {};

  window.rch_nws[hostkey] = {
    type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
    startTypeInvoke: false,
    rchRegistry: false,
    apkVersion: getAndroidVersion()
  };
}

window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
  if (!window.rch_nws[hostkey].startTypeInvoke) {
    window.rch_nws[hostkey].startTypeInvoke = true;

    var check = function check(good) {
      window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
      call();
    };

    if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
    else {
      var net = new Lampa.Reguest();
      net.silent('https://app.lovefilm.cc'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
        check(true);
      }, function() {
        check(false);
      }, false, {
        dataType: 'text'
      });
    }
  } else call();
};

window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
  window.rch_nws[hostkey].typeInvoke('https://app.lovefilm.cc', function() {

    client.invoke("RchRegistry", JSON.stringify({
      version: 149,
      host: location.host,
      rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : window.rch_nws[hostkey].type,
      apkVersion: window.rch_nws[hostkey].apkVersion,
      player: Lampa.Storage.field('player'),
	  account_email: Lampa.Storage.get('account_email'),
	  unic_id: Lampa.Storage.get('lampac_unic_id', ''),
	  profile_id: Lampa.Storage.get('lampac_profile_id', ''),
	  token: ''
    }));

    if (client._shouldReconnect && window.rch_nws[hostkey].rchRegistry) {
      if (startConnection) startConnection();
      return;
    }

    window.rch_nws[hostkey].rchRegistry = true;

    client.on('RchRegistry', function(clientIp) {
      if (startConnection) startConnection();
    });

    client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
      var network = new Lampa.Reguest();

      function result(html) {
        if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
          html = JSON.stringify(html);
        }

        if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
          var compressionStream = new CompressionStream('gzip');
          var encoder = new TextEncoder();
          var readable = new ReadableStream({
            start: function(controller) {
              controller.enqueue(encoder.encode(html));
              controller.close();
            }
          });
          var compressedStream = readable.pipeThrough(compressionStream);
          new Response(compressedStream).arrayBuffer()
            .then(function(compressedBuffer) {
              var compressedArray = new Uint8Array(compressedBuffer);
              if (compressedArray.length > html.length) {
                client.invoke("RchResult", rchId, html);
              } else {
                $.ajax({
                  url: 'https://app.lovefilm.cc/rch/gzresult?id=' + rchId,
                  type: 'POST',
                  data: compressedArray,
                  async: true,
                  cache: false,
                  contentType: false,
                  processData: false,
                  success: function(j) {},
                  error: function() {
                    client.invoke("RchResult", rchId, html);
                  }
                });
              }
            })
            .catch(function() {
              client.invoke("RchResult", rchId, html);
            });

        } else {
          client.invoke("RchResult", rchId, html);
        }
      }

      if (url == 'eval') {
        console.log('RCH', url, data);
        result(eval(data));
      } else if (url == 'evalrun') {
        console.log('RCH', url, data);
        eval(data);
      } else if (url == 'ping') {
        result('pong');
      } else {
        console.log('RCH', url);
        network["native"](url, result, function() {
          console.log('RCH', 'result empty');
          result('');
        }, data, {
          dataType: 'text',
          timeout: 1000 * 8,
          headers: headers,
          returnHeaders: returnHeaders
        });
      }
    });

    client.on('Connected', function(connectionId) {
      console.log('RCH', 'ConnectionId: ' + connectionId);
      window.rch_nws[hostkey].connectionId = connectionId;
    });
    client.on('Closed', function() {
      console.log('RCH', 'Connection closed');
    });
    client.on('Error', function(err) {
      console.log('RCH', 'error:', err);
    });
  });
};

  var nwsClient;
  
  window.lwsEvent = {
    uid: '', 
	connectionId: '',
	init: false
  };
  
  window.lwsEvent.send = function hubEvnt(name, data) {
    nwsClient.invoke("events", window.lwsEvent.uid, name, data);
  };
  
  window.lwsEvent.sendId = function hubEvnt(connectionId, name, data) {
    nwsClient.invoke("eventsId", connectionId, window.lwsEvent.uid, name, data);
  };

  function sendEvent(name, data) {
    var hubEvents = document.createEvent('CustomEvent');
    hubEvents.initCustomEvent('lwsEvent', true, true, {
      uid: window.lwsEvent.uid,
      name: name,
      data: data
    });

    document.dispatchEvent(hubEvents);
  }


  function account(url) {
    url = url + '';
    if (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    if (url.indexOf('uid=') == -1) {
      var uid = Lampa.Storage.get('lampac_unic_id', '');
      if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
    }
    return url;
  }


  function waitEvent() {
    if (!window.nwsClient) window.nwsClient = {};
    if (window.nwsClient[hostkey] && window.nwsClient[hostkey].socket)
      window.nwsClient[hostkey].socket.close();
    window.nwsClient[hostkey] = new NativeWsClient('https://app.lovefilm.cc/nws', {
      autoReconnect: true,
      reconnectDelay: 2000
    });
    nwsClient = window.nwsClient[hostkey];
    nwsClient.on('Connected', function(connectionId) {
      window.lwsEvent.connectionId = connectionId;
	  nwsClient.invoke("RegistryEvent", window.lwsEvent.uid);
      window.rch_nws[hostkey].Registry(nwsClient);
	  window.rch_nws[hostkey].connectionId = connectionId;
      sendEvent('system', 'connected');
    });
    nwsClient.on("event", function(uid, name, data) {
      sendEvent(name, data);
    });
    nwsClient.connect();
  }


  function start(j) {
    window.reqinfo = j;
    window.lwsEvent.init = true;
    window.lwsEvent.uid = j.user_uid;
    if (typeof NativeWsClient == 'undefined') {
      Lampa.Utils.putScript(["https://app.lovefilm.cc/js/nws-client-es5.js?v18112025"], function() {}, false, function() {
        waitEvent();
      }, true);
    } else waitEvent();
  }
  
  
  if (!window.lwsEvent.init) {
    if (!window.reqinfo) {
      var network = new Lampa.Reguest();
      network.silent(account('https://app.lovefilm.cc/reqinfo'), function(j) {
        if (j.user_uid)
          start(j);
      });
    } 
    else
      start(window.reqinfo);
  }

})();