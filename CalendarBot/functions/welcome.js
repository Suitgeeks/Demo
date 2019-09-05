'use strict';

// Initialize an object with user data
const userData = require("./userData");

// Dialog definition
var mainIntent = function(agent) {

    // Get sessionId
    const sessionId = agent.session.replace(/.*\//, '');

    // Get input context?
    // console.log(agent.contexts);  // show all contexts
    // let context = agent.context.get('sample context name');

    // Get the parameter from context?
    // var parameter = context.parametersparameterName;

    // Remove input context?
    // agent.context.delete('sample context name');

    // Get parameter?
    // let parameter = agent.parameters.parameterName;  

    // Get user data?
    // let data = userData.get(sessionId, 'sample key');   

    // Create response or do something
    const responses = [
        `Hallo!`,
        `Hoi!`,
        `Hey!`
      ];
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

// Export
exports.mainIntent = mainIntent;