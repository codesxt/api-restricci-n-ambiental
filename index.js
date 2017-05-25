var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var _condition = null;
var _conditionDate = null;
var _lastUpdate = null;

var buildCondition = function(cond, conditionDate, lastUpdate){
  var condition = "";
  switch(cond) {
    case "Bueno":
      condition = "bueno";
      break;
    case "Regular":
      condition = "regular";
      break;
    case "Alerta":
      condition = "alerta";
      break;
    case "Preemergencia":
      condition = "preemergencia";
      break;
    default:
      condition = "normal";
  }

  var json = {
    condition: condition,
    conditionDate: conditionDate,
    lastUpdate: lastUpdate
  };
  return json;
}

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

          $('.pronstico_ext').each(function(i, elem) {
            var data = $(this).text();
            console.log(i+":"+data);
          });


          $('.pronstico_ext').filter(function(){
            var data = $(this);
            condition = data.children().first().children().first().children().first().text();
            condition = condition.substring(2);

            conditionDate = data.children().first().children().first().text();
            conditionDate = conditionDate.replace("Pronóstico para el día  ", "");
            conditionDate = conditionDate.split(" : ")[0];
          })

          _condition = condition;
          _conditionDate = conditionDate;
          _lastUpdate = new Date();
      }
  })
}

updateCondition();

setInterval(function(){
  updateCondition();
  console.log("Updating data at: " + _lastUpdate + " with value: "+_condition);
}, 1000*60*60);

app.get('/condition', function(req, res){
  res.send(buildCondition(_condition, _conditionDate, _lastUpdate));
})

app.listen(process.env.PORT || '3000')
console.log('Server started on port '+ (process.env.PORT || '3000'));
exports = module.exports = app;
