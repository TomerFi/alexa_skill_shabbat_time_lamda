const Request = require('request');
const Alexa = require('alexa-sdk');
const jsonQuery = require('json-query');
const il_cities = require('./IL_Cities.json');
const USE_HELP = "For a list of all the possible city names, just ask me for help.";
const REPROMPT = "Please tell me the requested city name. "
const APP_ID = "amzn1.ask.skill.[Unique Skill ID]";

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    if(event.session.application.applicationId != APP_ID)
    {
      console.log("Invalid Application ID: "+event.session.application.applicationId)
      context.fail("Invalid Application ID");
    }
    this.attributes = {"lastIntent" : "none"};
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
     'LaunchRequest' : function() {
        try
        {
          this.attributes.lastIntent = "LaunchRequest";
          this.emit(':ask', "Welcome to shabbat times! What is your city name?", REPROMPT+USE_HELP);
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'ThanksIntent' : function() {
        try
        {
          //this.attributes.lastIntent = "ThanksIntent";
          this.emit(':tell', "Happy to assist you. Have a nice day.");
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "Happy to assist you. Have a nice day.");
        }
     },
     'GetCityIntent' : function() {
        try
        {
          this.attributes.lastIntent = "GetCityIntent";
          if (!this.event.request.intent.slots.City.value)
          {
            this.emit(':ask', "I'm sorry. I can't seem to find your requested city. Please repeat the city name. "+USE_HELP, REPROMPT+USE_HELP);
          }
          var city = this.event.request.intent.slots.City.value.toLowerCase();
          if (city.includes("suba")) {city = "kefar saba";}

          if (il_cities[city])
          {
              var geoname = il_cities[city].geoname;
              var geoid = il_cities[city].geoid;
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
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'AMAZON.YesIntent' : function(){
        try
        {
          this.attributes.lastIntent = "YesIntent";
          this.emit(':ask', "Please tell me the requested city.", REPROMPT+USE_HELP);
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'AMAZON.NoIntent' : function() {
        try
        {
          if (this.attributes.lastIntent == "HelpIntent")
          {
              this.attributes.lastIntent = "NoIntent";
              this.emit(':tell', "I'm sorry. Those are all the city names I know. Goodbye!");
          }
          else
          {
              this.attributes.lastIntent = "NoIntent";
              this.emit(':tell', "Goodbye!");
          }
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'AMAZON.CancelIntent' : function() {
        try
        {
          //this.attributes.lastIntent = "CancelIntent";
          this.emit(':tell', "Goodbye!");
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "Goodbye!");
        }
     },
     'AMAZON.StopIntent' : function() {
        try
        {
          if (this.attributes.lastIntent == "HelpIntent")
          {
              this.attributes.lastIntent = "StopIntent";
              this.emit(':ask', "Please tell me the requested city.", REPROMPT+USE_HELP);
          }
          else
          {
              this.attributes.lastIntent = "StopIntent";
              this.emit(':tell', "Goodbye!");
          }
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'AMAZON.HelpIntent' : function() {
        try
        {
          this.attributes.lastIntent = "HelpIntent";
          var speechOutput = "I can tell you the candle lighting time in the following cities :";
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
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. Something went wrong. I am doing my best to resolve this issue. Please try again later, goodbye.");
        }
     },
     'SessionEndedRequest' : function() {
        try
        {
          //this.attributes.lastIntent = "SessionEndedRequest";
          //console.log("Session ended reason: "+this.event.request.reason);
          this.emit(':tell', "Goodbye!");
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "Goodbye!");
        }
     },
     'Unhandled': function() {
         try
         {
          //this.attributes.lastIntent = "Unhandled";
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("UNHANDLED INTENT: requestType: "+this.event.request.type+forLog);
          this.emit(':tell', "I'm sorry. I am unable to help you at the moment. Please try again later!");
        }
        catch (e)
        {
          var forLog = "";
          if (this.event.request.intent) {forLog = forLog+" intent: "+this.event.intent.name};
          if (this.event.request.intent.slots) {forLog = forLog+" slotValue: "+this.event.intent.slots.City.value};
          console.log("EXCEPTION: "+e.message+" requestType: "+this.event.request.type+forLog);
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
                var rawdate = jsonQuery('items[category=candles].date', {data: data}).value;
                if (!rawdate)
                {
                  speechOutput("I'm sorry. Candle lighting time in: "+city+" has not been updated yet by Heb-Cal <say-as interpret-as=spell-out>api</say-as>. please try again later.");
                }
                var date = parseJSON("date", rawdate);
                var time = parseJSON("time", rawdate);

                if(!date || date == null || date == "") {
                    speechOutput("I'm sorry. Candle lighting time in: "+city+" has not been updated yet by Heb-Cal <say-as interpret-as=spell-out>api</say-as>. please try again later.");
                } else {
                    speechOutput("Candle lighting time in "+city+", is on "+date+", at "+time+".");
                }
            } else {
                speechOutput("I'm sorry. Heb-cal <say-as interpret-as=spell-out>api</say-as> is not responding. Please try again later.");
            }
        });
    }
    catch (e) {
        speechOutput("I'm sorry. I've encountered an error while trying to retrieve the requeset information. Please try again later.")
    }
}

function parseJSON(type, data) {
    var tIndex = data.indexOf('T')
    var pIndex = data.indexOf('+')
    if (type == "date") {
        return data.substring(0, tIndex)
    } else if (type == "time") {
        return tConvert(data.substring(tIndex + 1, pIndex))
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
