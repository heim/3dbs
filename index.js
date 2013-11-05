/**
 * term.js
 * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
 */

var http = require('http')
  , express = require('express')
  , io = require('socket.io')
  , pty = require('pty.js')
  , terminal = require('term.js')
  , redis = require('redis');

/**
 * term.js
 */

process.title = 'term.js';

/**
 * Dump
 */


/**
 * Open Terminal
 */

var buff = []
  , socket
  , redis_term;

//term = pty.fork(process.env.SHELL || 'sh', [], {
redis_term = pty.fork("redis-cli" || 'sh', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME
});

redis_term.on('data', function(data) {

  return !socket
    ? buff.push(data)
    : socket.emit('redis-term', data);
});

console.log(''
  + 'Created shell with pty master/slave'
  + ' pair (master: %d, pid: %d)',
  redis_term.fd, redis_term.pid);

/**
 * App & Server
 */

var app = express()
  , server = http.createServer(app);

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();
});

app.use(express.static(__dirname + '/public'));
app.use(terminal.middleware());

server.listen(3000);

server.on('connection', function(socket) {
  var address = socket.remoteAddress;
  if (address !== '127.0.0.1') {
    try {
      socket.destroy();
    } catch (e) {
      ;
    }
    console.log('Attempted connection from %s. Refused.', address);
  }
});

/**
 * Redis
 */

const redisClient = redis.createClient();
console.log('info', 'connected to redis server');

/**
 * Sockets
 */

io = io.listen(server, {
  log: false
});

redisClient.subscribe('realtime');

redisClient.on('message', function(channel, message) {
  console.log("message: " + message);
  if(channel == 'realtime') {
    socket.emit('redis', message);
  }
});

io.sockets.on('connection', function(sock) {
  socket = sock;
  socket.on('redis-term', function(data) {
    redis_term.write(data);
  });


  socket.on('disconnect', function() {
  //  redisClient.unsubscribe();
    socket = null;
  });

  while (buff.length) {
    socket.emit('redis-term', buff.shift());
  }
});
