var slideshow = remark.create({highlightStyle: "solarized"});

slideshow.on('showSlide', function(slide) {
  if(slide.properties.name == "redis-term") {
    slideshow.pause();
  }
});

document.getElementById('resume').onclick = function (e) {
  slideshow.resume();
  e.preventDefault();
};

var processed = [];



window.onload = function() {
  var socket = io.connect();
  
  $('.redis-cmd').click(function (e) {
    var command = $(e.target).text();
    console.log(command);
    //redis_term.write(command);
    socket.emit('redis-term', command + "\r");
    e.preventDefault();
  });

  socket.on('connect', function() {
    var redis_term = new Terminal({
      cols: 80,
      rows: 20,
      useStyle: true,
      screenKeys: true
    });

    redis_term.on('data', function(data) {
      socket.emit('redis-term', data);
    });


    redis_term.open(document.getElementById('redis-term'));

    socket.on('redis-term', function(data) {
      redis_term.write(data);
    });

    socket.on('disconnect', function() {
      redis_term.destroy();
    });

  });
  socket.on('redis', function(data) {
    $("#redis-list").append('<li>' + data + '</li>');
  });

};

