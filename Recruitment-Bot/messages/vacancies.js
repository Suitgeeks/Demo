"use strict";

// Load modules
const builder = require('botbuilder');
const dataForge = require('data-forge');
const path = require('path');

// Load local js files
const responses = require("./responses.js");

// Settings
const logging = true;

// Get all vacancies from database
const data = JSON.stringify(require('./database.json'));
const database = dataForge
    .fromJSON(data)
    .parseFloats(['latitude', 'longitude']); 
// database.asCSV().writeFileSync("./database.csv");  // output as csv for testing

// Create library
const library = new builder.Library('Vacancies');

// Add main dialog
library.dialog("Main", [
    function(session, args, next) {       
        // Process entities if present
        if (logging) console.log("entities = \n" + 
            JSON.stringify(args.entities, null, 4));
        const functionType = builder.EntityRecognizer.findEntity(args.entities, 'FunctionType');
        if (functionType) {
            session.conversationData['functionType'] = functionType.resolution.values[0];
        }
        if (logging) console.log("conversationData = \n" + 
            JSON.stringify(session.conversationData, null, 4));
        next();
    },
    function (session, args, next) {
        // Check if entity is known
        session.beginDialog("FunctionType");
    },    
    function (session, args, next) {
        // Check if entity is known
        session.beginDialog("Address");
    },
    function (session, args, next) {
        session.replaceDialog("Choose");
    }
]); 

// Add dialog
library.dialog("Choose", [
    function(session, args, next) {       
        // Find appropriate vacancies and save it        
        const vacancies = formatVacancies(
            filterVacancies(session.conversationData), "choice"
        );
        session.conversationData['vacancies'] = vacancies;
        if (logging) console.log("conversationData = \n" + 
            JSON.stringify(session.conversationData, null, 4)); 

        // Send response
        if (Object.keys(vacancies).length) {  // Some vacancies found
            // // Send as plain text
            // session.send(responses.vacanciesList.map( function(x) {
            //     return x.replace(/<<vacancies>>/g, 
            //         formatVacancies(vacancies, "bullets").join('\n'))
            // }));
            // Ask for a choice
            builder.Prompts.choice(session, responses.vacanciesPrompt, 
                vacancies, { listStyle: builder.ListStyle.button });
        } else {  // No vacancies found
            session.send(responses.vacanciesNone);
            session.endDialog();
        }
    },
    function (session, results, next) {
        // Get the result and save it
        const selection = session.conversationData['vacancies'][results.response.entity];
        session.conversationData['selection'] = selection;
        if (logging) console.log("conversationData = \n" + 
            JSON.stringify(session.conversationData, null, 4));

        // Send response
        session.send(responses.vacanciesSelection.map( function(x) {
            return x.replace(/<<selection>>/g, formatSelection(selection))
        }));
        session.endDialog();
    }
]);

// Add dialog
library.dialog("Address", [
    function (session, args, next) {
        // Check if entity is known
        if (session.conversationData['address']) {            
            // Ask for confirmation
            builder.Prompts.choice(session, 
                responses.vacanciesConfirmAddress.map( function(x) {
                    return x.replace(/<<address>>/g, 
                        session.conversationData['address'])
                }), "yes|no", { listStyle: builder.ListStyle.button });
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (logging) console.log("results = \n" + JSON.stringify(results, null, 4));
        if(!results.resumed){            
            // Reset data?
            if (results.response.entity === "no") {
                delete session.conversationData['address'];
            } 
        }
        next();
    },
    function (session, args, next) {
        // Check if entity is known
        if (session.conversationData['address']) {
            next();
        } else {
            session.beginDialog("Address:Main");
        }
    }
]);

// Add dialog
library.dialog("FunctionType", [
    function (session, args, next) {
        // Check if entity is known
        if (session.conversationData['functionType']) {            
            // Ask for confirmation
            builder.Prompts.choice(session, 
                responses.vacanciesConfirmFunctionType.map( function(x) {
                    return x.replace(/<<functionType>>/g, 
                        session.conversationData['functionType'])
                }), "yes|no", { listStyle: builder.ListStyle.button });
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (logging) console.log("results = \n" + JSON.stringify(results, null, 4));
        if(!results.resumed){            
            // Reset data?
            if (results.response.entity === "no") {
                delete session.conversationData['functionType'];
            } 
        }
        next();
    },
    function (session, args, next) {
        // Check if entity is known
        if (session.conversationData['functionType']) {
            session.endDialog();
        } else {
            builder.Prompts.choice(session, responses.vacanciesFunctionType, 
                "Sales|Data Science|Management", { listStyle: builder.ListStyle.button });
        }
    },
    function(session, results, next) {       
        if (logging) console.log("results = \n" + JSON.stringify(results, null, 4));
        // Save result
        if (results.response.entity === 'Sales') {
            session.conversationData['functionType'] = 'Sales';
        } else if (results.response.entity === 'Data Science') { 
            session.conversationData['functionType'] = 'Data Science';
        } else {
            session.conversationData['functionType'] = 'Management';
        }
        session.endDialog();
    }
]);

const maxDistance = 100;  // km
const maxNumber = 3;
const filterVacancies = function (data) {
    // if (logging) console.log("data = \n" + JSON.stringify(data, null, 4));

    // Filter the database on functionType and distance
    return database
        // filter on functionType
        .where(row => row["functionType"] === data['functionType'])  
        // calculate distance       
        .select(row => {           
            // clone the original so that we don't modify source data
            const clone = Object.assign({}, row);  
            clone['distance'] = Math.sqrt(
                // Latitude: 1 deg = 110.574 km in The Netherlands
                Math.pow(clone["latitude"]-Number(data['latitude']), 2) * 12321 + 
                // Longitude: 1 deg = 111.320*cos(latitude) km in The Netherlands 
                Math.pow(clone["longitude"]-Number(data['longitude']), 2) * 4670  
            );
            return clone;
        })
        // filter on distance and return the three closest as an array
        .where(row => row["distance"] <= maxDistance)
        .orderBy(row => row["distance"])
        .head(maxNumber)
        .toArray();
        // .asCSV().writeFileSync("./database_filterd.csv");  // output as csv for testing
}

const formatVacancies = function (vacancies, formatType="undefined") {
    // if (logging) console.log("vacancies = \n" + vacancies);

    // Format vacancies for sending to the user
    let formattedVacancies;    
    if (formatType === 'bullets') {
        formattedVacancies = [];
        for (let i = 0; i < vacancies.length; i++) {
            formattedVacancies.push(
                `* ` +
                `[${vacancies[i].title}](${vacancies[i].link})\n` + 
                `${vacancies[i].functionType} (${vacancies[i].jobType})\n` + 
                `${vacancies[i].city} (${vacancies[i].distance.toFixed(1)} km)` 
            );
        }
    } else if (formatType === 'choice') {
        formattedVacancies = {};
        for (let i = 0; i < vacancies.length; i++) {
            formattedVacancies[
                `${vacancies[i].title}\n` + 
                `${vacancies[i].functionType} (${vacancies[i].jobType})\n` + 
                `${vacancies[i].city} (${vacancies[i].distance.toFixed(1)} km)`
            ] = vacancies[i];
        }
    } else {
        throw new Error(`The format type "${formatType}" is not implemented`);
    }

    // if (logging) console.log("formattedVacancies = \n" + 
    //     JSON.stringify(formattedVacancies, null, 4));
    return formattedVacancies;  
}

const formatSelection = function (selection) {
    // if (logging) console.log("selection = \n" + 
    //     JSON.stringify(selection, null, 4));

    // Return the formatted selection for sending to the user
    return (
        `*${selection.datePublished} - ${selection.functionType} (${selection.jobType})*\n` + 
        `**${selection.title}**\n` + 
        `[Link to website](${selection.link})\n` + 
        `${selection.address}\n${selection.postalCode} ${selection.city}\n\n` + 
        `${selection.description}\n\n` +
        `Contact recruiter by email "${selection.emailAddress}" using reference number ${selection.referenceNumber}.`
    );
}

// Export library
module.exports = library;
