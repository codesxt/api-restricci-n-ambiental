var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var http    = require("http");

var _conditions = [];
var _lastUpdate = null;

var updateCondition = function(){
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
          var condition = "";
          var conditionDate = "";

          _conditions = [];
          $('.pronstico_ext').each(function(i, elem) {
            var data = $(this);
            condition = data.children().first().children().first().children().first().text();
            condition = condition.substring(2);

            conditionDate = data.children().first().children().first().text();
            conditionDate = conditionDate.replace("Pronóstico para el día  ", "");
            conditionDate = conditionDate.split(" : ")[0];

            _lastUpdate = new Date();

            _conditions.push({
              condition: condition.toLowerCase(),
              conditionDate: conditionDate,
              lastUpdate: _lastUpdate
            });
          });
      }
  })
}

updateCondition();

setInterval(function(){
  updateCondition();
  console.log("Updating data at: " + _lastUpdate);
}, 1000*60*60);

app.get('/', function(req, res){
  res.send("Application is alive!");
})

app.get('/condition', function(req, res){
  res.send(_conditions);
})

app.listen(process.env.PORT || '3000')
console.log('Server started on port '+ (process.env.PORT || '3000'));
exports = module.exports = app;

// Keeps application alive
setInterval(function() {
  http.get("http://restriccion-talca.herokuapp.com");
}, 1000*60*5);
