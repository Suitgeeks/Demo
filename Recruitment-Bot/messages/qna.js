"use strict";

// Load modules
var builder = require('botbuilder');

// Create library
const library = new builder.Library('Qna');

// Add main dialog
library.dialog("Main", [
    function (session, args, next) {
        // Get answer and send it to user
        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
        session.send(answerEntity.entity);
        session.endDialog();
    }
]);  

// Export library
module.exports = library;

