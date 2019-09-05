'use strict';

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Needed for date manipulation
const moment = require('moment-timezone');

// Time zone settings
const timeZone = 'Europe/Amsterdam';

// Initialize an object with user data
const userData = require("./userData");

// ------------------------------------------------------------------- //
//                          WebhookClient API                          //
// ------------------------------------------------------------------- //

// Load the client for dialogflow fulfillment
const {WebhookClient} = require('dialogflow-fulfillment');

// Create the basic request-response application
const app = (request, response) => {  
    process.stdout.write('\n\nNEW FULFILLMENT REQUEST\n------------------------\n');
    // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers, null, 4) + "\n");
    // console.log('Dialogflow Request body: ' + JSON.stringify(request.body, null, 4) + "\n");

    // Create webhook client
    const agent = new WebhookClient({request, response});
    process.stdout.write(`\nUser query was:\t` + agent.query + "\n");  

    // Get sessionId
    const sessionId = agent.session.replace(/.*\//, '');  
    process.stdout.write(`\nSession Id:\t` + sessionId + "\n");  

    // Display user data
    console.log(`User data:\n` + JSON.stringify(userData.get(sessionId), null, 4));     

    // Display intent
    process.stdout.write(`\nIntent recognized:\t` + agent.intent + "\n");

    // Display all parameters
    process.stdout.write(`\nParameters:\n` + 
        JSON.stringify(agent.parameters, null, 4) + "\n");

    // Display all input contexts
    process.stdout.write(`\nInput contexts:\n` + 
        JSON.stringify(agent.contexts, null, 4) + "\n");

    // Save time of last activity
    userData.set(sessionId, 'lastActivity', 
        moment().tz(timeZone).format("YYYY-MM-DDTHH:mm:ss"));
    
    // Map all intents to the corresponding functions
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome.mainIntent);  

    intentMap.set('Repair Appointment', repairAppointment.mainIntent);
    intentMap.set('Repair Appointment - object', repairAppointment.otherIntent);
    intentMap.set('Repair Appointment - address', repairAppointment.otherIntent);
    intentMap.set('Repair Appointment - date-time', repairAppointment.otherIntent);
    intentMap.set('Repair Appointment - find-slot', repairAppointment.otherIntent);
    intentMap.set('Repair Appointment - fallback', repairAppointment.fallbackIntent);
    // intentMap.set('Create Appointment', createAppointment.handleIntent);
    agent.handleRequest(intentMap);
}

// Import the different dialogs
var welcome = require("./welcome");
var repairAppointment = require("./repairAppointment");
// var createAppointment = require("./createAppointment");

// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflow = functions.https.onRequest(app);