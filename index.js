const Request = require('request');
const Alexa = require('alexa-sdk');
const il_cities = require('./resources/IL_Cities.json');
const us_cities = require('./resources/US_Cities.json');
const gb_cities = require('./resources/GB_Cities.json');
const USE_HELP = "For a list of all the possible city names, just ask me for help.";
const REPROMPT = "Please tell me the requested city name. ";
const ERR_PROMPT = "I'm sorry. Something went wrong. I'm doing my best to resolve this issue. Please try again later. goodbye."
const FAIL_PROMPT = "I'm sorry. I can't seem to find your requested city. Please repeat the city name. ";
const APP_ID = "amzn1.ask.skill.[Unique Skill ID]";
const SUNSET_DIFF = 40;
var OFFSET = 0;

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    if(event.session.application.applicationId != APP_ID)
    {
      console.log("Invalid Application ID: "+event.session.application.applicationId)
      context.fail("Invalid Application ID");
    }
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
     'LaunchRequest' : function() {
        try
        {
          this.attributes = sessionAttribs('LaunchRequest', this.event.session.attributes);
          this.emit(':ask', "Welcome to shabbat times! What is your city name?", REPROMPT+USE_HELP);
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'ThanksIntent' : function() {
        try
        {
           this.emit(':tell', "Happy to assist you. Have a nice day.");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Happy to assist you. Have a nice day.");
        }
     },
     'GetCityIntent' : function() {
        try
        {
          this.attributes = sessionAttribs('GetCityIntent', this.event.session.attributes);
          if (!this.event.request.intent.slots)
          {
            this.emit(':ask', FAIL_PROMPT+USE_HELP, REPROMPT+USE_HELP);  
          }
          getChosen(this.event, function (data){
            if (data == 'error') {
              this.emit(':ask', FAIL_PROMPT+USE_HELP, REPROMPT+USE_HELP);
            }
            var idx = data.indexOf('|');
            this.attributes['city'] = data.substring(0, idx);
            this.attributes['country'] = data.substring(idx + 1);
          }.bind(this));
          var city = this.attributes['city'];
          var country = this.attributes['country'];
          var cities;
          if (country == "IL") {
            cities = il_cities;
          } else if(country == "GB") {
            cities = gb_cities;
          } else {
            cities = us_cities;
          }
          if (cities[city])
          {
              var geoname = cities[city].geoname;
              this.attributes['geoname'] = geoname;
              var geoid = cities[city].geoid;
              this.attributes['geoid'] = geoid;
              var timestamp = this.event.request.timestamp;
              var currentDate = new Date(timestamp);
              var shabbatDate = getNextShabbat(currentDate);
              getJSON(geoid, shabbatDate, timestamp, function(speechOutput) {
                  this.emit(':askWithCard', speechOutput+"<break time='500ms'/>Would you like me to get the shabbat times in another city?", "If you're interested in another city, please tell me the city name. "+USE_HELP, "Shabbat times: "+geoname, speechOutput);
              }.bind(this))       
          }
          else {
              this.emit(':ask', "I'm sorry. I cannot find the requested city. Please tell me the name of another city nearby. "+USE_HELP, REPROMPT+USE_HELP);
          }
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'AMAZON.YesIntent' : function(){
        try
        {
          this.attributes = sessionAttribs('YesIntent', this.event.session.attributes);
          this.emit(':ask', "Please tell me the requested city.", REPROMPT+USE_HELP);
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'AMAZON.NoIntent' : function() {
        try
        {
          if (this.event.session.attributes['lastIntent'] == "CountrySelected")
          {
               var speechOutput = "I'm sorry. Those are all the city names I know";
               if (this.attributes['country'] == 'US') {
                  speechOutput = speechOutput + " in the United States! Please try again, Goodbye!";
               }
               else if (this.attributes['country'] == 'IL') {
                  speechOutput = speechOutput + " in Israel! Please try again, Goodbye!";
               }
               else if (this.attributes['country'] == 'GB') {
                  speechOutput = speechOutput + " in the United Kingdom! Please try again, Goodbye!";
               }
               else {
                  speechOutput = speechOutput + "! Please try again, Goodbye!";
               }
               this.emit(':tell', speechOutput);
          }
          else
          {
              this.emit(':tell', "Ok.");
          }
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Ok.");
        }
     },
     'AMAZON.CancelIntent' : function() {
        try
        {
          this.emit(':tell', "Ok.");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Ok.");
        }
     },
     'AMAZON.StopIntent' : function() {
        try
        {
          if ((this.event.session.attributes['lastIntent']).includes("CountrySelected"))
          {
              this.attributes = sessionAttribs('StopIntent', this.event.session.attributes);
              this.emit(':ask', "Please tell me the requested city.", REPROMPT+USE_HELP);
          }
          else
          {
              this.emit(':tell', "Ok.");
          }
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'AMAZON.HelpIntent' : function() {
        try
        {
          this.attributes = sessionAttribs('HelpIntent', this.event.session.attributes);
          this.emit(':ask', "I can list all the city names i know in the United States, the United Kingdom, and in Israel. Which country would you like to hear about?", "Please tell me your country! United States, United Kingdom, or Israel.");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'CountrySelected' : function() {
        try
        {
          this.attributes = sessionAttribs('CountrySelected', this.event.session.attributes);
          if (!this.event.request.intent.slots)
          {
            this.emit(':ask', "I'm sorry. The only countries I know are the United States, the United Kingdom, and Israel. Please repeat the country name. "+USE_HELP, REPROMPT+USE_HELP);  
          }
          var speechOutput = "These are the city names I know in ";
          var cities;
          var country = this.event.request.intent.slots.Country.value.toLowerCase();

          switch (country) {
            case "united states":
            this.attributes['country'] = 'US';
            speechOutput = speechOutput+"the United States: ";
            cities = us_cities;
            break;
            case "israel":
            this.attributes['country'] = 'IL';
            speechOutput = speechOutput+"Israel: ";
            cities = il_cities;
            break;
            default:
            this.attributes['country'] = 'GB';
            speechOutput = speechOutput+"the United Kingdom: ";
            cities = gb_cities;
            break;
          }

          for (var key in cities)
          {
              if (cities[key].list == "yes") {
                  speechOutput = speechOutput + key + ", ";    
              }
          }
          speechOutput = speechOutput.slice(0, -2) + ". Was you city on the list?";
          this.emit(':ask', speechOutput, REPROMPT.slice(0, -1));
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'SessionEndedRequest' : function() {
        /*try
        {
          this.emit(':tell', "Goodbye!");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Goodbye!");
        }*/
     },
     'Unhandled': function() {
        try
         {
          console.log("UNHANDLED INTENT: intentName: "+this.event.request.intent.name);
          this.emit(':tell', "I'm sorry. I am unable to help you at the moment. Please try again later!");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "I'm sorry. I am unable to help you at the moment. Please try again later!");
        }
     }
}


function getJSON (geoid, shabbatDate, timestamp, speechOutput) {
    var current_ts = new Date(timestamp);
    var year = shabbatDate.slice(0,4);
    var month = shabbatDate.slice(5,-3);
    var hebcal_url = "http://www.hebcal.com/hebcal/?v=1&cfg=json&maj=off&min=off&mod=off&nx=off&year="+year+"&month="+month+"&ss=off&mf=off&c=on&geo=geoname&geonameid="+geoid+"&m=0&s=off";
    Request.get(hebcal_url, function(error, response, body){
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var city = data.location.city;
            var latitude = data.location.latitude;
            var longitude = data.location.longitude;
            var start_raw = parseJson(data, shabbatDate);
            if (!start_raw || start_raw == null || start_raw == "" || start_raw == "error")
            {
              throw new Error("failed to parse json for date, selected city is: "+city+";");
            }
            else
            {
              try {
                var start_ts = new Date(start_raw);
                var start_date = [start_ts.getFullYear(), ('0' + (start_ts.getMonth() + 1)).slice(-2), ('0' + start_ts.getDate()).slice(-2)].join('-');
                var start_time = tConvert([('0' + start_ts.getHours()).slice(-2), ('0' + start_ts.getMinutes()).slice(-2), ('0' + start_ts.getSeconds()).slice(-2)].join(':'));

                var end_ts = new Date(start_raw);
                end_ts.setDate(end_ts.getDate() + 1);
                var end_date = [end_ts.getFullYear(), ('0' + (end_ts.getMonth() + 1)).slice(-2), ('0' + end_ts.getDate()).slice(-2)].join('-');

                var sunrise_url = "https://api.sunrise-sunset.org/json?lat="+latitude+"&lng="+longitude+"&date="+end_date+"&formatted=0";

                Request.get(sunrise_url,function(err, resp, bod){
                  if (!err && resp.statusCode == 200) {
                    var sunrise_data = JSON.parse(bod);
                    var sunset = sunrise_data.results.sunset.slice(0,-6);
                    var sunset_ts = convertUTCDateToLocalDate(new Date(sunset));
                    sunset_ts.setMinutes(sunset_ts.getMinutes() + SUNSET_DIFF);
                    sunset_ts = roundSeconds(sunset_ts);
                    var end_time = tConvert([('0' + sunset_ts.getHours()).slice(-2), ('0' + sunset_ts.getMinutes()).slice(-2), ('0' + sunset_ts.getSeconds()).slice(-2)].join(':'));

                    var speechPart1 = "starts on friday. ";
                    var speechPart2 = "and ends on saturday. ";

                    if (current_ts.getTime() == start_ts.getTime() || current_ts.getTime() == sunset_ts.getTime() || (current_ts.getTime() > start_ts.getTime() && current_ts.getTime() < sunset_ts.getTime())) {
                      switch (current_ts.getDay() - start_ts.getDay()) {
                        case 1:
                        speechPart1 = "started yesterday. "
                        break;
                        case 0:
                        speechPart1 = "starts today. "
                        break;
                      }
                      switch (sunset_ts.getDay() - current_ts.getDay()) {
                        case 1:
                        speechPart2 = "and ends tomorrow. "
                        break;
                        case 0:
                        speechPart2 = "and ends today. "
                        break;
                      }
                    }
                    else if (start_ts.getFullYear() == current_ts.getFullYear() && start_ts.getMonth() == current_ts.getMonth() && (start_ts.getDate() - current_ts.getDate() == 1)) {
                      speechPart1 = "starts tomorrow. "
                    }

                    var speech = "Shabbat times in "+city+": "+speechPart1+start_date+", at "+start_time+". "+speechPart2+end_date+", at "+end_time+".";
                    speechOutput(speech);                

                  }
                  else {
                    throw new Error("failed to to get sunset time for "+city+";");
                  }
                })
              }
              catch (e) {
                throw new Error("failed to convert raw date to date and time, raw date is: "+start_raw+";");
              }
            }
        } else {
            throw new Error("failed to retrieve data from api. error is: "+error+"; response is: "+response+";");
        }
    });
}

function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
}

function getChosen (event, data) {
  var city = "";
  var country = "";
  if(event.request.intent.slots.City_IL.value) {
    city = event.request.intent.slots.City_IL.value.toLowerCase();
    country = "IL";
  }
  else if (event.request.intent.slots.City_US.value) {
    city = event.request.intent.slots.City_US.value.toLowerCase();
    country = "US";
  }
  else if (event.request.intent.slots.City_GB.value) {
    city = event.request.intent.slots.City_GB.value.toLowerCase();
    country = "GB";
  }
  else {
    data('error');
  }
  data(city+'|'+country);
}

function sessionAttribs(intentName, attribs) {
  
  var attributes = attribs;
  attributes['lastIntent'] = intentName;
  if (attributes['city'] == "" || attributes['city'] == null) {attributes['city'] = 'none';}
  if (attributes['country'] == "" || attributes['country'] == null) {attributes['country'] = 'none';}
  if (attributes['geoname'] == "" || attributes['geoname'] == null) {attributes['geoname'] = 'none';}
  if (attributes['geoid'] == "" || attributes['geoid'] == null) {attributes['geoid'] = 'none';}
  return attributes;
}

function getNextShabbat(fullDate){
    var date = fullDate;
    if (date.getDay() < 5) {
      date.setDate(date.getDate() + (5-date.getDay()));
    }
    else if (date.getDay() == 6) {
      date.setDate(date.getDate() - 1);
    }
    return date.getFullYear()+'-'+("0"+(date.getMonth()+1)).slice(-2)+'-'+("0"+date.getDate()).slice(-2);
}

function parseJson(data, shabbatDate) {
  for (var i = 0; i < data.items.length; i++) {
    var date = data.items[i]['date'].slice(0,-6);
    if (date.includes(shabbatDate)) {
      OFFSET = convertOffset(data.items[i]['date'].slice(-6));
      return date;
    }
  }
  return 'error';
}

function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    var hours = date.getHours();
    newDate.setHours(hours - OFFSET);

    return newDate;   
}

function convertOffset(off) {
  var scale = off.slice(0,1);
  var hourMinute = off.slice(1).split(':');
  var hours = parseInt(hourMinute[0], 10);
  var minutes = hourMinute[1] ? parseInt(hourMinute[1], 10) : 0;
  if (scale == '+') {
    return 0 - hours+minutes/60;
  }
  return hours+minutes/60;
}

function roundSeconds(date) {
  if (date.getSeconds() > 29) {
    date.setMinutes(date.getMinutes() + 1);
  }
  date.setSeconds(0);
  return date;
}
