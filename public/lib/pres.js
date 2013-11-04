
var slideshow = remark.create({highlightStyle: "solarized"});

slideshow.on('showSlide', function(slide) {
  if(slide.properties.name == "terminal") {
    console.log("pausing");
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
  socket.on('connect', function() {
    var term = new Terminal({
      cols: 80,
      rows: 20,
      useStyle: true,
      screenKeys: true
    });

    term.on('data', function(data) {
      socket.emit('terminal', data);
    });

    term.on('title', function(title) {
      document.getElementById('title').innerText = title;
    });

    term.open(document.getElementById('container'));

    term.write('\x1b[31mWelcome to term.js!\x1b[m\r\n');

      socket.on('terminal', function(data) {
        term.write(data);
      });



      socket.on('disconnect', function() {
        term.destroy();
      });
  });

  socket.on('redis', function(data) {
    $("#list").append('<li>' + data + '</li>');
  });
};

