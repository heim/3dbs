
var http = require('http')
  , express = require('express')
  , io = require('socket.io')
  , pty = require('pty.js')
  , terminal = require('term.js')
  , neo4j = require('neo4j')
  , _ = require('underscore')
  , redis = require('redis');
var exec = require('child_process').exec;



process.title = 'term.js';

/**
 * Open Terminal
 */

var redis_buff = []
  , mongo_buff = []
  , socket
  , mongo_term
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
    ? redis_buff.push(data)
    : socket.emit('redis-term', data);
});


mongo_term = pty.fork("mongo" || 'sh', [], {
  name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color')
    ? 'xterm-256color'
    : 'xterm',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME
});

mongo_term.on('data', function(data) {
  return !socket
    ? mongo_buff.push(data)
    : socket.emit('mongo-term', data);
});

console.log(''
  + 'Created redis-term with pty master/slave'
  + ' pair (master: %d, pid: %d)',
    redis_term.fd, redis_term.pid);
console.log(''
  + 'Created mongo-term with pty master/slave'
  + ' pair (master: %d, pid: %d)',
    mongo_term.fd, mongo_term.pid);

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

redisClient.subscribe('realtime');

redisClient.on('message', function(channel, message) {
  console.log("message: " + message);
  if(channel == 'realtime') {
    socket.emit('redis', message);
  }
});

/*
 * neo4j
 */

//var graphdb = new neo4j.GraphDatabase('http://localhost:7474');
//
//var query = 'match (char)-[:APPEARED_IN]-(episode) where char.character = "Madame Vastra"  return char,episode';
//graphdb.query(query, {}, function(err, results) {
//  _.each(results, console.log);
//});


exec("open http://localhost:3000");

/**
 * Sockets
 */

io = io.listen(server, {
  log: false
});

io.sockets.on('connection', function(sock) {
  socket = sock;
  socket.on('redis-term', function(data) {
    redis_term.write(data);
  });

  socket.on('mongo-term', function(data) {
    mongo_term.write(data);
  });

  socket.on('disconnect', function() {
  //  redisClient.unsubscribe();
    socket = null;
  });

  while (mongo_buff.length) {
    socket.emit('mongo-term', mongo_buff.shift());
  }
  while (redis_buff.length) {
    socket.emit('redis-term', redis_buff.shift());
  }
});
