(function() {

  'use strict';

  var duplicator = require('../');

  var log = module.parent.log;
  // log = console.log.bind(console, '[Worker]'.green);

  function init(argv) {

    log('worker started with pid', process.pid);

    var server = duplicator(function(client, forward, duplicate) {

      if (argv.f) {
        forward(argv.f);
      }

      if (argv.d) {
        duplicate(argv.d, argv.r);
      }
    });
    server.listen(argv.p);
  }

  module.exports = {
    'init': init
  };

}).call();