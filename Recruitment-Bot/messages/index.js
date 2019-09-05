"use strict";

// Display information for if statements later
console.log("\n\n----------------------------------------\n" +
            "Script starting\n" + 
            "----------------------------------------\n\n");

// Load modules
const builder = require("botbuilder");
const botbuilder_azure = require("botbuilder-azure");
const builder_cognitiveservices = require("botbuilder-cognitiveservices");

// Load local js files
const responses = require("./responses.js");

// Settings
const logging = true;

// Display information for if statements later
console.log({
    ifBotEnv: process.env['BotEnv'] ? true : false,
    ifAzureWebJobsStorage: process.env['AzureWebJobsStorage'] ? true : false
});

// Try to load settings to a variable env
let env = {};
try {
    const json = require('../local.settings.json'); 
    if (json['IsEncrypted'] === true) {
        throw new Error('Cannot use settings in json file - they are encrypted.');
    }
    env = json.Values;
  }
catch(err) {
    console.log("Warning: local.settings.json not found...")
}
// console.log("Contents of env:\n" + JSON.stringify(env, null, 4));

// Create the chat connector
let connector;
if (process.env['BotEnv']) {  // on Azure or using Functions Core Tools
    connector =  new botbuilder_azure.BotServiceConnector({
        appId: process.env['MicrosoftAppId'],
        appPassword: process.env['MicrosoftAppPassword'],
        openIdMetadata: process.env['BotOpenIdMetadata']
    });
} else {  // direct coupling to emulator
    connector =  new builder.ChatConnector();  
}

// Create actual bot
const bot = new builder.UniversalBot(connector, {});

// Create bot storage
let storage;
if (process.env['AzureWebJobsStorage']) {  // Azure table storage
    const azureTableClient = new botbuilder_azure.AzureTableClient(  
        'botdata', process.env['AzureWebJobsStorage']
    );
    storage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
}
else {  // Storage in local memory
    storage = new builder.MemoryBotStorage();  
}
bot.set('storage', storage);

// Luis variables (dispatch works only for V4)
const luisAppId = process.env['LuisAppId'] || env['LuisAppId'];
const luisAPIKey = process.env['LuisAPIKey'] || env['LuisAPIKey'];
const luisAPIHostName = process.env['LuisAPIHostName'] || env['LuisAPIHostName'];

// Luis variables verification
if (!(luisAPIKey && luisAppId && luisAPIHostName)) { 
    throw 'Please set LuisAPIHostName, LuisAppId and LuisAPIKey in Application Settings.';
}

// Create a recognizer that gets intents from LUIS
const luisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + 
    '?subscription-key=' + luisAPIKey;
const luisRecognizer = new builder.LuisRecognizer(luisModelUrl);

// QnA variables (dispatch works only for V4)
const qnaKnowledgeBaseId = process.env['QnaKnowledgeBaseId'] || env['QnaKnowledgeBaseId']; 
const qnaAuthKey = process.env['QnaAuthKey'] || env['QnaAuthKey'];
const qnaEndpointHostName = process.env['QnaEndpointHostName'] || env['QnaEndpointHostName'];

// QnA variables verification
if (!(qnaAuthKey && qnaKnowledgeBaseId && qnaEndpointHostName)) { 
    throw 'Please set QnaEndpointHostName, QnaKnowledgeBaseId and QnaAuthKey in Application Settings.';
}

// Create a recognizer for QnAMaker service
const qnaRecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    endpointHostName: qnaEndpointHostName,
    knowledgeBaseId: qnaKnowledgeBaseId,
    authKey: qnaAuthKey, 
    top: 5
});

//=========================================================
// Bot Dialogs
//=========================================================

// Display welcome message when the bot enters the room (before the user says anything)
bot.on('conversationUpdate', function (activity) {
    if (activity.membersAdded) {
        activity.membersAdded.forEach(
            (identity) => {
            if (identity.id === activity.address.bot.id) { // check if the bot entered
                // Send welcome message
                bot.beginDialog(activity.address, 'Welcome:Main');                 
            }
        });
    }
});

// Add middleware
bot.use({
    botbuilder: function (session, next) {
        session.sendTyping();   // sends typing, but just one time...
        // some output on the recognizers when debugging
        if (logging) {
            console.log('\nMessage text was: %s\n', session.message.text);
            // Recognize with Luis for debugging
            luisRecognizer.recognize(session,
                function logLuisIntents (err, results) {
                    if (err) return console.error(err);
                    console.log("\nLuis' results: Top intent was %s with score %s.\n",
                        results.intent, String(results.score));
                });
            // Recognize with QnA for debugging
            qnaRecognizer.recognize(session,
                function logQnaIntents (err, results) {
                    if (err) return console.error(err);
                    console.log('\nQnA results: Top intent was %s with score %s.\n',
                        results.intent, String(results.score));
                });
        }
        next();
    }
});


// ---------------------- ROOT INTENT DIALOG ---------------------- //

// Define root intent dialog 
const rootIntents = new builder.IntentDialog({  
    recognizers: [
        luisRecognizer,
        qnaRecognizer
    ], 
    intentThreshold: 0.7,
    recognizeOrder: 'parallel'  // 'series' 
})
.onDefault([ // Dialog for when the intent score is too low (including debugging commands)
    function(session,args,next){
        // // some output on the recognizers when debugging
        // if (logging) {
        //     console.log('\nMessage text was: %s\n', session.message.text);
        //     // Recognize with Luis for debugging
        //     luisRecognizer.recognize(session,
        //         function logLuisIntents (err, results) {
        //             if (err) return console.error(err);
        //             console.log("\nLuis' results: Top intent was %s with score %s.\n",
        //                 results.intent, String(results.score));
        //         });
        //     // Recognize with QnA for debugging
        //     qnaRecognizer.recognize(session,
        //         function logQnaIntents (err, results) {
        //             if (err) return console.error(err);
        //             console.log('\nQnA results: Top intent was %s with score %s.\n',
        //                 results.intent, String(results.score));
        //         });
        // }
        // Default message handler
        session.send(responses.didNotUnderstand);
    }
]);

// Default dialog
bot.dialog('/',rootIntents);


// ------------------------ OTHER DIALOGS -------------------------//

bot.library(require('./welcome'));

bot.library(require('./aboutMe'));
rootIntents.matchesAny(['AboutMe', 'Help'],'AboutMe:Main');

bot.library(require('./greeting'));
rootIntents.matchesAny(['Greeting'],'Greeting:Main');

bot.library(require('./vacation'));
rootIntents.matchesAny(['Vacation'],'Vacation:Main');

bot.library(require('./workingHours'));
rootIntents.matchesAny(['WorkingHours'],'WorkingHours:Main');

bot.library(require('./vacancies'));
rootIntents.matchesAny(['Vacancies'],'Vacancies:Main');
rootIntents.matchesAny(['ChooseVacancy'],'Vacancies:Choose');
rootIntents.matchesAny(['UpdateVacancy'],'Vacancies:Main');

bot.library(require('./qna'));
rootIntents.matchesAny(['qna'],'Qna:Main');

bot.library(require('./address'));


// Create interface for request and response
if (process.env['BotEnv']) {  // on Azure or using Functions Core Tools
    module.exports = connector.listen();
} else {
    const restify = require('restify');
    const server = restify.createServer();
    server.listen(3978, function() {
        console.log('Bot listening to endpoint http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());  
}