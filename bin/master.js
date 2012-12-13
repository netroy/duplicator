(function() {

  'use strict';

  var cluster = require('cluster');

  var log = module.parent.log;

  function serverInfo(argv) {

    log("Listening on port:", argv.p);

    if (argv.f) {
      log("Forwarding to:", argv.f);
    }

    if (argv.d) {
      log("Duplicating to:", argv.d);
    }

    if (argv.r) {
      log("Sample rate:", argv.r);
    }
  }

  var workers = {};
  function spawn(argv) {
    var worker = cluster.fork();
    workers[worker.process.pid] = worker;
    worker.send(argv);
    return worker;
  }

  function onDeath(worker) {
    log('worker ' + worker.process.pid + ' died. spawning a new process...');
    setTimeout(spawn, 100);
    delete workers[worker.process.pid];
  }

  function init(argv) {

    spawn = spawn.bind(null, argv);

    var count = require('os').cpus().length;
    for (var i = 0; i < count; i++) {
      spawn();
    }

    cluster.on('death', onDeath);

    serverInfo(argv);
  }

  module.exports = {
    'init': init
  };

}).call();