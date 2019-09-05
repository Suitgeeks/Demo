"use strict";

// Load modules
var builder = require('botbuilder');

// Load local js files
const responses = require("./responses.js");

// Create library
const library = new builder.Library('AboutMe');

// Add main dialog
library.dialog("Main", [
    function(session, args, next) {       
        // Send response
        session.send(responses.aboutMe);
        session.endDialog();
    }
]);  

// Export library
module.exports = library;