var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var http    = require("http");

var UPDATE_INTERVAL = 1000*60*60;


// Regular  : PM10 150 a 194 ug/m3
// Bueno    : PM10 de 0 a 149 ug/m3

var _conditions = [];
var _lastUpdate = null;

var getHealthWarnings = (condition) => {
  switch(condition){
    case 'alerta':
      return "Empeoramiento de salud de personas con enfermedades respiratorias y cardiovasculares. Aumento de síntomas respiratorios en población general. Niños y tercera edad deberían evitar ejercicio prolongado. Población general debería limitar ejercicio prolongado.";
      break;
    case 'regular':
      return "Niños y tercera edad deberían evitar ejercicio prolongado. Población general debería limitar ejercicio prolongado.";
      break;
    case 'bueno':
      return "No hay advertencias.";
      break;
    default:
      return "No hay recomendaciones de salud";
  }
  return
}

var getRestrictions = (condition) => {
  switch(condition){
    case 'alerta':
      return [
        { message:"No se permitirán humos visibles provenientes de viviendas entre las 18:00 horas y 23:59 horas (en polígono único)." },
        { message:"Se suspenderán actividades físicas y deportivas al aire libre y al interior de gimnasios, después de las 19:00 horas." }
      ]
      break;
    case 'bueno':
      return [
        { message:"No se consideran medidas."}
      ]
      break;
    case 'regular':
      return [
        { message:"No se consideran medidas."}
      ]
      break;
    default:
      return [
        { message:"No hay recomendaciones de salud."}
      ];
  }
  return
}

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
              condition = condition.toLowerCase()
            }
            if(rowsRead%3==2 && rowsRead != 6){
              // Create and append object
              _lastUpdate = new Date();
              _conditions.push({
                condition: condition,
                conditionDate: conditionDate,
                lastUpdate: _lastUpdate,
                healthWarnings: getHealthWarnings(condition),
                restrictions: getRestrictions(condition)
              });
            }
            rowsRead += 1;
          });
          console.log(JSON.stringify(_conditions, null, 4));

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

app.get('/health-warning/:condition', (req, res) => {
  res.send(getHealthWarnings(req.params.condition));
})

app.get('/restrictions/:condition', (req, res) => {
  res.send(getRestrictions(req.params.condition));
})

app.listen(process.env.PORT || '3007')
console.log('Server started on port '+ (process.env.PORT || '3007'));
exports = module.exports = app;

// Keeps application alive
/*
setInterval(function() {
  http.get("http://restriccion-talca.herokuapp.com");
}, 1000*60*5);*/
