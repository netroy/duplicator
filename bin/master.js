(function() {

  'use strict';

  var cluster = require('cluster');
  var optimist = require('optimist');
  var duplicator = require('../');

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

  function parseArgs() {
    optimist
    .usage('Usage: $0 [-hv] -p port -f host:port [-d host:port] [-r int]')
    .options('h', {
      'alias': 'help',
      'describe': 'show usage information'
    })
    .options('v', {
      'alias': 'version',
      'describe': 'show version information'
    })
    .options('p', {
      'alias': 'port',
      'describe': 'port to listen on, defaults to PORT',
      'default': process.env.PORT
    })
    .options('f', {
      'alias': 'forward',
      'describe': 'host to forward to'
    })
    .options('d', {
      'alias': 'duplicate',
      'describe': 'host to duplicate to'
    })
    .options('r', {
      'alias': 'rate',
      'describe': 'rate to sample traffic',
      'default': 1
    })
    .check(function(argv){

      if (argv.h) {
        throw '';
      }

      if (argv.v) {
        log(duplicator.version);
        process.exit();
      }

      if (!argv.p) {
        throw new Error('You must specify a port, either via the -p option or in the PORT environment variable');
      }

      if (!argv.f) {
        throw new Error('You must specify a host to forward to with -f option');
      }
    });
    return optimist.argv;
  }

  function onDeath(worker) {
    log('worker ' + worker.process.pid + ' died. spawning a new process...');
    setTimeout(spawn, 100);
    delete workers[worker.process.pid];
  }

  function init() {

    var argv = parseArgs();
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