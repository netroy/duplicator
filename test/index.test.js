(function() {

  'use strict';

  var test = require('tap').test;
  var duplicator = require('../');
  var helloServer = require('./servers/hello');
  var sinkServer = require('./servers/sink');
  var helloClient = require('./clients/hello');

  function randomPort() {
    return Math.floor(Math.random() * (Math.pow(2,16) - 1e4) + 1e4);
  }

  test('duplicator', function (t) {

    var origin = helloServer('hello world');
    origin.port = randomPort();
    origin.listen(origin.port, onConnect);

    var sink = sinkServer();
    sink.port = randomPort();
    sink.listen(sink.port, onConnect);

    var proxy = duplicator(function(connection, forward, duplicate) {
      forward('0.0.0.0' + origin.port);
      duplicate('0.0.0.0' + sink.port);
    });

    proxy.listen(proxy.port = randomPort(), onConnect);

    var servers = [origin, sink, proxy];
    var connected = 0;

    function onConnect () {

      if (++connected < servers.length) {
        return;
      }

      var client = helloClient(proxy.port);
      client.on('done', function(res) {

        // Check the result is right
        t.equal(res.statusCode, 200, "got status code from origin");
        t.equal(res.headers['content-type'], 'text/plain', "got content-type from origin");
        t.equal(res.body, 'hello world', "got body from origin");

        // Check that the sink got the message
        t.equal(sink.log.length, 1, "sink intercepted a message");
        t.equal(sink.log[0], '/hello', "sink got the right message");

        // Kill the servers
        servers.forEach(function(server){
          server.close();
        });
        t.end();
      });
    }
  });

}).call();