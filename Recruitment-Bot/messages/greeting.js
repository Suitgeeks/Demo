"use strict";

// Load modules
var builder = require('botbuilder');

// Load local js files
const responses = require("./responses.js");

// Create library
const library = new builder.Library('Greeting');

// Add main dialog
library.dialog("Main", [
    function(session, args, next) {       
        // Send response
        session.send(responses.greeting);
        session.endDialog();
    }
]);  

// Export library
module.exports = library;