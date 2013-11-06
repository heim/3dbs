var slideshow = remark.create({highlightStyle: "solarized"});

slideshow.on('showSlide', function(slide) {
  if(slide.properties.name == "redis-term" || slide.properties.name == "mongo-term") {
    slideshow.pause();
  }
});

$('.resume').click(function (e) {
  slideshow.resume();
  e.preventDefault();
});


window.onload = function() {
  var socket = io.connect();
  
  $('.redis-cmd').click(function (e) {
    var command = $(e.target).text();
    console.log(command);
    //redis_term.write(command);
    socket.emit('redis-term', command + "\r");
    e.preventDefault();
  });
  $('.mongo-cmd').click(function (e) {
    var command = $(e.target).text();
    console.log(command);
    //redis_term.write(command);
    socket.emit('mongo-term', command + "\r");
    e.preventDefault();
  });

  socket.on('connect', function() {
    /*
     *
     * Redis term
     *
     */
    var redis_term = new Terminal({
      cols: 80,
      rows: 20,
      useStyle: true,
      screenKeys: true
    });

    redis_term.on('data', function(data) {
      socket.emit('redis-term', data);
    });

    socket.on('redis-term', function(data) {
      redis_term.write(data);
    });

    redis_term.open(document.getElementById('redis-term'));
    /* Redis-websocket */
    socket.on('redis', function(data) {
      $("#redis-list").append('<li>' + data + '</li>');
    });

    /*
     * Mongo-term
     */
    var mongo_term = new Terminal({
      cols: 80,
      rows: 20,
      useStyle: true,
      screenKeys: true
    });

    mongo_term.on('data', function(data) {
      socket.emit('mongo-term', data);
    });


    mongo_term.open(document.getElementById('mongo-term'));

    socket.on('mongo-term', function(data) {
      mongo_term.write(data);
    });

    /* drep alt ved disconnect */
    socket.on('disconnect', function() {
      mongo_term.destroy();
      redis_term.destroy();
    });

  });

};

