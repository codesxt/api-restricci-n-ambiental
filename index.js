var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var _restriction = null;
var _lastUpdate = null;

var buildRestriction = function(restr, lastUpdate){
  var restriction = "";
  switch(restr) {
    case "Bueno":
      restriction = "bueno";
      break;
    case "Regular":
      restriction = "regular";
      break;
    case "Alerta":
      restriction = "alerta";
      break;
    case "Preemergencia":
      restriction = "preemergencia";
      break;
    default:
      restriction = "normal";
  }

  var json = {
    restriction: restriction,
    lastUpdate: lastUpdate
  };
  return json;
}

var updateRestriction = function(){
  // The URL we will scrape from - in our example Anchorman 2.
  url = 'http://alertas.mma.gob.cl/talca-y-maule/';
  // The structure of our request call
  // The first parameter is our URL
  // The callback function takes 3 parameters, an error, response status code and the html
  request(url, function(error, response, html){
      // First we'll check to make sure no errors occurred when making the request
      if(!error){
          // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
          var $ = cheerio.load(html);
          var restriccion = "";
          $('.pronstico_ext').filter(function(){
            var data = $(this);
            restriccion = data.children().first().children().first().children().first().text();
            restriccion = restriccion.substring(2);
          })
          _restriction = restriccion;
          _lastUpdate = new Date();
      }
  })
}

updateRestriction();

setInterval(function(){
  updateRestriction();
  console.log("Updating data at: " + _lastUpdate + " with value: "+_restriction);
}, 1000*60*60);

app.get('/restriction', function(req, res){
  res.send(buildRestriction(_restriction, _lastUpdate));
})

app.listen(process.env.PORT || '3000')
console.log('Server started on port '+ (process.env.PORT || '3000'));
exports = module.exports = app;
