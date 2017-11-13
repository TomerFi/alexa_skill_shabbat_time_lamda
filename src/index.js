const Request = require('request');
const Alexa = require('alexa-sdk');
const jsonQuery = require('json-query');
const il_cities = require('./IL_Cities.json');
const us_cities = require('./US_Cities.json');
const USE_HELP = "For a list of all the possible city names, just ask me for help.";
const REPROMPT = "Please tell me the requested city name. "
const ERR_PROMPT = "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye."
const APP_ID = "amzn1.ask.[Unique Skill ID]";

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
            this.emit(':ask', "I'm sorry. I can't seem to find your requested city. Please repeat the city name. "+USE_HELP, REPROMPT+USE_HELP);  
          }
          getChosen(this.event, function (data){
            var idx = data.indexOf('|');
            this.attributes['city'] = data.substring(0, idx);
            this.attributes['country'] = data.substring(idx + 1);
          }.bind(this));
          var city = this.attributes['city'];
          var country = this.attributes['country'];
          console.log("selected city: "+city+"; country: "+country+";");
          var cities = getCities(country);
          if (cities[city])
          {
              var geoname = cities[city].geoname;
              this.attributes['geoname'] = geoname;
              var geoid = cities[city].geoid;
              this.attributes['geoid'] = geoid;
              getJSON(geoid, function(speechOutput) {
                  this.emit(':askWithCard', speechOutput+"<break time='500ms'/>Would you like to get candle lighting time in another city?", "If you're interested in another city, please tell me the city name. "+USE_HELP, "Candle ligting time: "+geoname, speechOutput);
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
          if (this.event.session.attributes['lastIntent'] == "CountrySelectedIL")
          {
               this.emit(':tell', "I'm sorry. Those are all the city names I know in Israel! Please try again, Goodbye!");
          }
          else if (this.event.session.attributes['lastIntent'] == "CountrySelectedUS")
          {
               this.emit(':tell', "I'm sorry. Those are all the city names I know in the United States! Please try again, Goodbye!");
          }          
          else
          {
              this.emit(':tell', "Goodbye!");
          }
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Goodbye!");
        }
     },
     'AMAZON.CancelIntent' : function() {
        try
        {
          this.emit(':tell', "Goodbye!");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Goodbye!");
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
              this.emit(':tell', "Goodbye!");
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
          this.emit(':ask', "I can tell you the city names in the United States and in Israel. Which country would you like to hear about?", "Please tell me your country! United States, or Israel.");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', ERR_PROMPT);
        }
     },
     'CountrySelectedUS' : function() {
        try
        {
          this.attributes = sessionAttribs('CountrySelectedUS', this.event.session.attributes);
          var speechOutput = "These are the city names I know in the United States: ";
          for (var key in us_cities)
          {
              if (us_cities[key].list == "yes") {
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
     'CountrySelectedIL' : function() {
        try
        {  
          this.attributes = sessionAttribs('CountrySelectedIL', this.event.session.attributes);
          var speechOutput = "These are the city names I know in Israel: ";
          for (var key in il_cities)
          {
              if (il_cities[key].list == "yes") {
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
        try
        {
          this.emit(':tell', "Goodbye!");
        }
        catch (e)
        {
          console.log("EXCEPTION: "+e.message+"; intentName: "+this.event.request.intent.name);
          this.emit(':tell', "Goodbye!");
        }
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


function getJSON (geoid, speechOutput) {
    try {
        var url = "http://www.hebcal.com/shabbat/?cfg=json&geonameid="+geoid+"&m=0";
        Request.get(url, function(error, response, body){
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var city = data.location.city;
                var rawdate = (jsonQuery('items[category=candles].date', {data: data}).value).slice(0,-6);
                if (!rawdate || rawdate == null || rawdate == "")
                {
                  speechOutput("I'm sorry. Candle lighting time in: "+city+" has not been updated yet by Heb-Cal <say-as interpret-as='spell-out'>api</say-as>. please try again later.");
                }
                else
                {
                  var tIndex = rawdate.indexOf('T')
                  var date = rawdate.substring(0, tIndex);
                  var time = tConvert(rawdate.substring(tIndex+1));

                  if(!date || date == null || date == "") {
                      speechOutput("I'm sorry. Candle lighting time in: "+city+" has not been updated yet by Heb-Cal <say-as interpret-as='spell-out'>api</say-as>. please try again later.");
                  } else {
                      speechOutput("Candle lighting time in "+city+", is on "+date+", at "+time+".");
                  }
                }
            } else {
                speechOutput("I'm sorry. Heb-cal <say-as interpret-as='spell-out'>api</say-as> is not responding. Please try again later.");
            }
        });
    }
    catch (e) {
        speechOutput("I'm sorry. I've encountered an error while trying to retrieve the requeset information. Please try again later.")
    }
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

function getCities (country) {
  if (country == "IL")
  {
    return il_cities;  
  }
  return us_cities;
}

function getChosen (event, data) {
  var city = "";
  var country = "";
  if(event.request.intent.slots.City_IL.value) {
    city = event.request.intent.slots.City_IL.value.toLowerCase();
    country = "IL";
  }
  else {
    city = event.request.intent.slots.City_US.value.toLowerCase();
    country = "US";
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

