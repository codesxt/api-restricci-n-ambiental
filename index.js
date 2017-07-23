var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var http    = require("http");

var UPDATE_INTERVAL = 1000*60*60;

var _conditions = [];
var _lastUpdate = null;

var updateCondition = function(){
  url = 'http://alertas.mma.gob.cl/comunas/talca';
  request(url, function(error, response, html){
      if(!error){
          var $ = cheerio.load(html);
          var condition = "";
          var conditionDate = "";
          _conditions = [];

          var rowsRead = 0;
          $('#aire .row').each(function(i, elem){
            //console.log("Reading row: " + rowsRead);
            //console.log(rowsRead%3);
            var data = $(this);
            if(rowsRead%3==0 && rowsRead != 6){
              conditionDate = data.text();
              conditionDate = conditionDate.replace("Pronostico para el ", "").trim();
            }
            if(rowsRead%3==1 && rowsRead != 6){
              // Extract Condition
              condition = data.find($('h3')).text().trim();
              condition = condition.split(' ')[0];
            }
            if(rowsRead%3==2 && rowsRead != 6){
              // Create and append object
              _lastUpdate = new Date();
              _conditions.push({
                condition: condition.toLowerCase(),
                conditionDate: conditionDate,
                lastUpdate: _lastUpdate
              });
            }
            rowsRead += 1;
          });
          console.log(_conditions);

          /*
          $('.pronstico_ext').each(function(i, elem) {
            var data = $(this);
            condition = data.children().first().children().first().children().first().text();
            condition = condition.substring(2);

            conditionDate = data.children().first().children().first().text();
            conditionDate = conditionDate.replace("Pronostico para el ", "");
            conditionDate = conditionDate.split(" : ")[0];

            _lastUpdate = new Date();

            _conditions.push({
              condition: condition.toLowerCase(),
              conditionDate: conditionDate,
              lastUpdate: _lastUpdate
            });
            console.log(_conditions);
          });
          */
      }else{
        console.log(error);
      }
  })
}

updateCondition();

setInterval(function(){
  updateCondition();
  console.log("Updating data at: " + _lastUpdate);
}, UPDATE_INTERVAL);

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
