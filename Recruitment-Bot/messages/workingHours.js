"use strict";

// Load modules
var builder = require('botbuilder');

// Load local js files
const responses = require("./responses.js");

// Create library
const library = new builder.Library('WorkingHours');

// Add main dialog
library.dialog("Main", [
    function(session, args, next) {       
        // Process entity if present
                // console.log("entities = \n" + JSON.stringify(args.entities, null, 4));
        const jobType = builder.EntityRecognizer.findEntity(args.entities, 'JobType');
        if (jobType) {
            session.conversationData['jobType'] = jobType.resolution.values[0];
        }
        // console.log("conversationData = \n" + JSON.stringify(session.conversationData, null, 4));
        next();
    },
    function(session, args, next) {   
        // Check if jobType is known
        if (session.conversationData['jobType']) {
            next();
        } else {
            session.beginDialog("JobType");
        }
    },
    function(session, args, next) {       
        // Send answer
        if (session.conversationData['jobType'] === 'Part-time') {
            session.send(responses.workingHoursPartTime);
        } else {
            session.send(responses.workingHoursFullTime);
        }
        session.endDialog();
    }
]);  

// Add dialog
library.dialog("JobType", [
    function(session, args, next) {       
        builder.Prompts.choice(session, responses.workingHoursJobType, 
            "full time|part time", { listStyle: builder.ListStyle.button });
    },
    function(session, results, next) {       
        // Save result
        if (results.response.entity === 'full time') {
            session.conversationData['jobType'] = 'Full-time';
        } else {
            session.conversationData['jobType'] = 'Part-time';
        }
        session.endDialog();
    }
]);  

// Export library
module.exports = library;