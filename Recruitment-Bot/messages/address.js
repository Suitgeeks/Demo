"use strict";

// Settings
const logging = true;

// Load modules
var builder = require('botbuilder');
var fetch = require('node-fetch');

// Load local js files
const responses = require("./responses.js");

// Create library
const library = new builder.Library('Address');

// Add main dialog
library.dialog("Main", [
    function(session, args, next) {    
        if (args && args.reprompt) {
            builder.Prompts.text(session, responses.addressReprompt);
        } else {
            builder.Prompts.text(session, responses.addressPrompt);
        }
    },
    function(session, results, next) {  
        if (logging) console.log({results});

        // Get the address based on the user's response
        fetchLocation(results.response)
        .then(address => {
            if (logging) console.log("address contains:\n" + 
                JSON.stringify(address, null, 4));
            session.conversationData['latitude'] = address.latitude;
            session.conversationData['longitude'] = address.longitude;
            session.conversationData['address'] = address.description;
            next();
            return;
        })
        .catch(error => {
            if (logging) console.log(error);
            session.replaceDialog("Main", { reprompt: true });
            return;
        });
    },
    function(session, args, next) {       
        // Ask for confirmation
        builder.Prompts.choice(session, 
            responses.addressConfirmation.map( function(x) {
                return x.replace(/<<adress>>/g, session.conversationData['address'])
            }), "yes|no", { listStyle: builder.ListStyle.button });
    },
    function(session, results, next) {    
        if (results.response.entity === 'yes') {
            session.endDialog();
        } else {
            // Wrong address, try again
            delete session.conversationData['latitude'];
            delete session.conversationData['longitude'];
            delete session.conversationData['address'];
            session.replaceDialog("Main", { reprompt: true });
        }
        
    }
]); 

// get geographical location
var fetchLocation = function (text) {
    // Implement with promise
    return new Promise((resolve, reject)=>{

        // Initialize
        let address = {};

        // Openstreetmap URL
        const fetch_from_url = `https://nominatim.openstreetmap.org/?` + 
            `format=json&format=json&limit=1&addressdetails=1` + 
            `&q=${text.replace(/\s/g, '+')}`;
        if (logging) console.log('Openstreet URL:\n%s', fetch_from_url);     
        
        // // Gmaps URL        
        // var fetch_from_url  = 'https://maps.googleapis.com/maps/api/geocode/json?key=' + gmapsKey + 
        //     `&address=${text.replace(/\s/g, '+')}&components=country:NL`    
        // if (logging) console.log('Google Maps URL:\n%s', fetch_from_url);
    
        // Get geographical coordinates from URL
        fetch(fetch_from_url)
        .then(response => {
            // console.log(response);
            return response.json();
        })
        .then(data => { 
            if (logging) console.log("data contains:\n" + JSON.stringify(data, null, 4));

            // Check if there was a result Openstreetmap
            if (data.length === 0) {
                return reject(new Error("No results found with this query. Location not found."));
            }

            // Bounds Openstreetmap
            var height = data[0]['boundingbox'][1]-data[0]['boundingbox'][0];
            var width = data[0]['boundingbox'][3]-data[0]['boundingbox'][2];

            // // Bounds Gmaps
            // var height = data['results'][0]['geometry']['bounds']['northeast']['lat']-
            //     data['results'][0]['geometry']['bounds']['southwest']['lat'];
            // var width = data['results'][0]['geometry']['bounds']['northeast']['lng']-
            //     data['results'][0]['geometry']['bounds']['southwest']['lng'];

            if (height < 0.3 && width < 0.6){
                // Geographical location Gmaps
                address['latitude'] = data[0]['lat'];
                address['longitude'] = data[0]['lon'];

                // // Geographical location Gmaps
                // address['latitude'] = data['results'][0]['geometry']['location']['lat'];
                // address['longitude'] = data['results'][0]['geometry']['location']['lng'];
            }
            else {
                return reject(new Error("Bounding box too large! Location not found."));
            }

            // Description Openstreetmap
            const details = data[0]['address'];
            let description = '';
            if (details['road']) description += details['road'];
            if (details['house_number']) description += ' ' + details['house_number'];
            if (description !== '') description += '\n';
            if (details['postcode']) description += details['postcode'] + ' ';
            if (details['city'] || details['town'] || details['village'] || details['suburb']) 
                description += (details['city'] || details['town'] || details['village'] || details['suburb']);
            if (details['country']) description += '\n' + details['country'];
            address['description'] = description;

            // return result
            return resolve(address);
        }) 
    });
};

// Export library
module.exports = library;