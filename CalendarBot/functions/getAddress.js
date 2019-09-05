"use strict";

// Initialize an object with user data
const userData = require("./userData");

// Dialog definition
var handleIntent = function(agent) {

    // Initialization
    let responses, outContext;     

    // Get sessionId
    const sessionId = agent.session.replace(/.*\//, '');

    // Get address from user query
    const address = addressRecognizer(agent.query);

    if (address) {
        // Save the postal code and house number
        const postalCode = address.postalCode;
        userData.set(sessionId, "postalCode", postalCode);
        const houseNumber = address.houseNumber;
        userData.set(sessionId, "houseNumber", houseNumber);

        // Create response and outgoing context
        responses = [
            `Ik begrijp de postcode ${postalCode} en het huisnummer ${houseNumber}. ` + 
                `Wanneer wil je een afspraak inplannen?`
        ];
        outContext = [{
            'name': 'get-address',
            'lifespan': 0
        }];
    } else { 
        // No address found in user query
        responses = [
            `Ik heb geen postcode en huisnummer begrepen. Kun je het nog een keer proberen?`
        ];
        outContext = [{
            'name': 'get-address',
            'lifespan': 5
        }];
    }
    
    const pick = Math.floor(Math.random() * responses.length);
    agent.add(responses[pick]);

    // Save user data?
    // userData.set(sessionId, 'testKey', 'testValue');
    // console.log({userData: userData.get(sessionId)}); 

    // Set outgoing context?
    // let outContext = [{
    //     'name':'context-name',
    //     'lifespan': 5,
    //     'parameters': { 
    //       'parameter-name':'parameter-value'
    //     }
    // }]
    // for (let context of outContext) {
    //   agent.context.set(context);   
    // }

    // For debugging
    // console.log(`\n\nPrint something for debugging\n`);

    // Return agent
    return agent;
}

// Install a custom recognizer for addresses
var addressRecognizer = function (text) {
    let match;

    // Postal code first
    const postalCodeHouseNumberRegex = new RegExp(
        "(?:\\b([1-9][0-9]{3}) ?([a-z]{2})\\b)" + // postal code (group 1 and 2)
        "(?:[^1-9]*)" + // anything in between
        "(?:\\b([1-9][0-9]*)" + // house numbers (group 3)
        "(?:(?:[-\\. ]+)?([1-9][0-9]*)?" + // additional numbers (group 4)
        "(?:(?:[-\\. ]+)?([a-z]{1,2})?\\b)))",'i'); // additional letters (group 5)
    match = postalCodeHouseNumberRegex.exec(text);
    if (match) {
        return {
            postalCode: match[1] + match[2],
            houseNumber: match[3] + (match[4] ? '-'+match[4] : '') + 
            (match[5] ? match[5] : '')
        }
    }
    else  {
        // House number first
        const houseNumberPostalCodeRegex = new RegExp(
            "(?:\\b([1-9][0-9]*)" + // house numbers (group 1)
            "(?:(?:[-\\. ]+)?([1-9][0-9]*)?" + // additional numbers (group 2)
            "(?:(?:[-\\. ]+)?([a-z]{1,2})?\\b)))" + // additional letters (group 3)
            "(?:[^1-9]*)" + // anything in between
            "(?:\\b([1-9][0-9]{3}) ?([a-z]{2})\\b)",'i');  // postal code (group 4 and 5)          
        match = houseNumberPostalCodeRegex.exec(text);
        if (match) {
            return {
                postalCode: match[4] + match[5],
                houseNumber: match[1] + (match[2] ? '-'+match[2] : '') + 
                    (match[3] ? match[3] : '')
            }
        }
    }
    // Not a complete address found
    return undefined;      
}

// Export
exports.handleIntent = handleIntent;

