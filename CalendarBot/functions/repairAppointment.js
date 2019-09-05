'use strict';

// Initialize an object with user data
const userData = require("./userData");

// Helper function for date, time and address
const helper = require("./helperFunctions");

// Function for creating appointments in a Google calendar
const calendar = require("./calendar");

// Load database with objects and responsibles
const objectTypes = require("./objectTypes.json");

// Main dialog definition
var mainIntent = function(agent) {

    // Remove input context
    agent.context.delete("further-assistance");

    // Initialization
    let responses;    

    // Create response and outgoing contexts
    responses = [
        `Dat is heel vervelend.`,
        `Vervelend om te horen.` 
    ];

    // Add responses and outgoing context
    const pick = Math.floor(Math.random() * responses.length);
    agent.add(responses[pick]);    

    // Create response based on necessary parameters
    return getParameters(agent);
}

// Ohter dialogs definition
var otherIntent = function(agent) {

    // Create response based on necessary parameters
    return getParameters(agent);
}

// Fallback dialog definition
var fallbackIntent = function(agent) {

    // Get context for fallback count
    const context = agent.context.get('repair-appointment-fallback');
    const fallbackCount = context? context.parameters['fallbackCount'] + 1 : 1;

    // Create outgoing contexts
    let outContext = [{
        'name': 'repair-appointment-fallback',
        'lifespan': 1,
        'parameters': {
            'fallbackCount': fallbackCount
        }
    }];

    // Add outgoing context
    for (let context of outContext) {
        agent.context.set(context);   
    }

    // Create response based on necessary parameters
    return getParameters(agent, fallbackCount);
}

// Dialog to get the necessary parameters
var getParameters = function(agent, fallbackCount=0) {

    // Initialization
    let responses, outContext = [];    

    // Get sessionId
    const sessionId = agent.session.replace(/.*\//, '');

    // Load saved data
    let object = userData.get(sessionId, "object");
    let objectType = userData.get(sessionId, "objectType");
    let responsible = userData.get(sessionId, "responsible");
    let dateStart = userData.get(sessionId, "dateStart");
    let dateEnd = userData.get(sessionId, "dateEnd");
    let timeStart = userData.get(sessionId, "timeStart");
    let timeEnd = userData.get(sessionId, "timeEnd");
    let date = userData.get(sessionId, "date");
    let time = userData.get(sessionId, "time");
    let postalCode = userData.get(sessionId, "postalCode");
    let houseNumber = userData.get(sessionId, "houseNumber");

    // Attemp to find the broken object and the responsible
    if (agent.parameters.object) {
        console.log('Setting object');
        object = agent.parameters["object"];
        objectType = findKey(objectTypes, object);
        responsible = objectTypes[objectType].responsible;
        userData.set(sessionId, "object", object);
        userData.set(sessionId, "objectType", objectType);
        userData.set(sessionId, "responsible", responsible);
    }
    // Attemp to find the period, date and time
    if (agent.parameters["date-period"]) {
        console.log('Setting date-period');
        dateStart = agent.parameters["date-period"].startDate;
        userData.set(sessionId, "dateStart", dateStart);
        dateEnd = agent.parameters["date-period"].endDate;
        userData.set(sessionId, "dateEnd", dateEnd);
    }
    if (agent.parameters["time-period"]) {
        console.log('Setting time-period');
        timeStart = agent.parameters["time-period"].startTime;
        userData.set(sessionId, "timeStart", timeStart);
        timeEnd = agent.parameters["time-period"].endTime;
        userData.set(sessionId, "timeEnd", timeEnd);
    }    
    if (agent.parameters["date"]) {
        console.log('Setting date');
        date = agent.parameters["date"];
        userData.set(sessionId, "date", date);
    }
    if (agent.parameters["time"]) {
        console.log('Setting time');
        time = agent.parameters["time"];
        userData.set(sessionId, "time", time);
    }
    // Attempt to find an address from the user query
    const address = helper.addressRecognizer(agent.query);
    if (address) {
        console.log('Setting address');
        postalCode = address.postalCode;
        userData.set(sessionId, "postalCode", postalCode);
        houseNumber = address.houseNumber;
        userData.set(sessionId, "houseNumber", houseNumber);
    }

    console.log({userData: userData.get(sessionId)});

    // Create response and outgoing contexts if all parameters are present
    if (object && postalCode && houseNumber && date && time) {
        // Everything known to plan an appointment
        agent = calendar.createAppointment(agent, object, postalCode, houseNumber, date, time);
    } else if (object && postalCode && houseNumber && dateStart && dateEnd) {
        // Everything known to plan an appointment
        agent = calendar.showAppointments(agent, dateStart, dateEnd);
    } else if (object && postalCode && houseNumber && timeStart && timeEnd && date) {
        // Everything known to plan an appointment
        agent = calendar.showAppointments(agent, timeStart, timeEnd, date);
    } else {

        // Create response and outgoing contexts at first mentioning of a broken object
        if (agent.parameters.object) {
            if (responsible === "corporation") {
                responses = [
                    `Volgens mijn gegevens is de woningcorporatie verantwoordelijk voor reparatie ` + 
                        `van ${objectType}. Om een afspraak in te plannen, heb ik wat informatie ` + 
                        `van je nodig.`,
                    `De woningcorporatie is volgens mijn gegevens verantwoordelijk voor deze ` + 
                        `reparatie. Voor een afspraak heb ik wat gegevens van je nodig.`
                ];
                outContext = [{
                    'name': 'repair-appointment',
                    'lifespan': 15
                }];
            } else if (responsible === "service contract") {
                responses = [
                    `Ik help u graag. Ben je in het bezit van een serviceabonnement?`,
                    `Ik ga u helpen. Is er een serviceabonnement voor de betreffende woning?`
                ];
                outContext = [{
                    'name': 'service-contract',
                    'lifespan': 5
                }];
            } else if (responsible === "tenant") {
                responses = [
                    `Helaas ben je als huurder zelf verantwoordelijk voor het onderhoud en de reparatie van ${objectType}. ` + 
                        `Kan ik je verder nog ergens mee helpen?`,
                    `Als huurder ben je volgens mijn gegevens zelf verantwoodelijk voor deze reparatie. ` + 
                        `Kan ik je nog verder van dienst zijn?`
                ];
                outContext = [{
                    'name': 'further-assistance',
                    'lifespan': 5
                }];
            } else {
                throw Error (`Responsible for ${object} not found in objectTypes.json.`);
            }
            // Add responses and outgoing context
            const pick = Math.floor(Math.random() * responses.length);
            agent.add(responses[pick]);    
            for (let context of outContext) {
                agent.context.set(context);   
            }
        }

        // Create response and outgoing contexts depending when parameters are missing
        if (!object) {
            // Object not known
            switch (fallbackCount) {
                case 0:
                    responses = [
                        `Wat is er precies kapot?`,
                        `Kun je me vertellen wat er gerepareerd moet worden?`
                    ];
                    break;            
                case 1:
                    responses = [
                        `Ik begrijp het niet. Wat is er dan precies kapot in je woning?`,
                        `Ik versta je helaas niet. Wat moet er gerepareerd moet worden in je woning?`
                    ];
                    break;
                case 2:
                    responses = [
                        `Ik snap helaas nog steeds niet wat er kapot is. ` + 
                            `Ik verwacht een antwoord zoals "de cv-ketel" of "de afvoer".`,
                        `Ik begrijp helaas nog steeds niet wat er gerepareerd moet worden. ` + 
                            `Ik verwacht een antwoord zoals "de cv-ketel" of "de afvoer".`,
                    ];
                    break;
                case 3:
                    responses = [
                        `Het lijkt erop dat ik niet slim genoeg ben om je antwoord te begrijpen. ` + 
                            `Laten we stoppen. Hopelijk tot de volgende keer!`,
                        `Ik lijk je helaas niet te kunnen begrijpen. ` + 
                            `Laten we dan maar stoppen. Hopelijk tot de volgende keer!`
                    ];
                    outContext = [{
                        'name': 'repair-appointment',
                        'lifespan': 0
                    }];
                    break;     
                default:
                    throw new Error("fallbackCount has an unexpected value");
            } 
        } else if (!(postalCode && houseNumber)) {
            // Address still unkown
            switch (fallbackCount) {
                case 0:
                    responses = [
                        `Kun je me je postcode en huisnummer geven?`,
                        `Wat zijn je postcode en huisnummer?`
                    ];
                    break;
                case 1:
                    responses = [
                        `Ik heb je postcode en/of huisnummer nog niet begrepen. ` + 
                            `Kun je het nog eens proberen?`,
                        `Ik snap je adres helaas niet goed. ` + 
                            `Wat zijn dan je postcode en huisnummer?`
                    ];
                    break;  
                case 2:
                    responses = [
                        `Ik begrijp het helaas nog steeds niet. ` + 
                            `Ik verwacht een postcode en huisnummer zoals "1234AB, 16A".`,
                        `Helaas snap ik het nog steeds niet.`  + 
                            `Ik verwacht een postcode en huisnummer zoals "1234AB, 16A".`,
                    ];
                    break;                                      
                case 3:
                    responses = [
                        `Het lijkt erop dat ik niet slim genoeg ben om je antwoord te begrijpen. ` + 
                            `Laten we stoppen. Hopelijk tot de volgende keer!`,
                        `Ik lijk je helaas niet te kunnen begrijpen. ` + 
                            `Laten we dan maar stoppen. Hopelijk tot de volgende keer!`
                    ];
                    outContext = [{
                        'name': 'repair-appointment',
                        'lifespan': 0
                    }];                    
                    break;                                                               
                default:
                    throw new Error("fallbackCount has an unexpected value");
            }
        } else if (!(date && time) && !(dateStart && dateEnd) && !(timeStart && timeEnd && date)) {
            // Date, time and/or period still unkown
            switch (fallbackCount) {
                case 0:
                    if (!date && !time) {
                        responses = [
                            `Wanneer zou je een afspraak willen laten inplannen?`,
                            `Kun je me een datum en tijd geven om een afspraak in te plannen?`
                        ];
                    } else if (!date) {
                        responses = [
                            `Ik heb om ${helper.getLocaleTimeString(time)} begrepen, maar nog geen datum. ` + 
                                `Op welke dag zou je een afspraak willen laten inplannen?`,
                            `Ik begrijp ${helper.getLocaleTimeString(time)}, maar ik heb de datum niet verstaan. ` + 
                                `Kun je me een datum geven om een afspraak in te plannen? `
                        ];
                    } else if (!time) {
                        responses = [
                            `Ik heb ${helper.getLocaleDateString(date)} begrepen, maar nog geen tijd. ` + 
                                `Hoe laat zou je een afspraak willen laten inplannen?`,
                            `Ik begrijp ${helper.getLocaleDateString(date)}, maar ik heb de tijd niet verstaan. ` + 
                                `Kun je me een tijd geven om een afspraak in te plannen? `
                        ];
                    }
                    break;    
                case 1:
                    if (!date && !time) {
                        responses = [
                            `Ik helaas heb geen tijd of datum begrepen. ` + 
                                `Wanneer zou je een afspraak willen laten inplannen?`,
                            `Ik heb nog geen tijd en datum verstaan. ` + 
                                `Kun je me een periode of datum en tijd geven om een afspraak in te plannen?`
                        ];
                    } else if (!date) {
                        responses = [
                            `Ik heb om ${helper.getLocaleTimeString(time)} begrepen, maar helaas nog geen datum. ` + 
                                `Op welke dag zou je een afspraak willen laten inplannen?`,
                            `Ik begrijp ${helper.getLocaleTimeString(time)}, maar ik heb nog geen datum verstaan. ` + 
                                `Kun je me een datum geven om een afspraak in te plannen? `
                        ];
                    } else if (!time) {
                        responses = [
                            `Ik heb ${helper.getLocaleDateString(date)} begrepen, maar helaas nog geen tijd. ` + 
                                `Hoe laat zou je een afspraak willen laten inplannen?`,
                            `Ik begrijp ${helper.getLocaleDateString(date)}, maar ik heb nog geen tijd verstaan. ` + 
                                `Kun je me een tijd geven om een afspraak in te plannen? `
                        ];
                    }
                    break;    
                case 2:
                    if (!date && !time) {
                        responses = [
                            `Ik begrijp helaas nog steeds geen datum of tijd. ` + 
                                `Ik verwacht bijvoorbeeld "morgen om 14:00", "24 augustus om tien uur" of "ergens volgende week"`,
                            `Ik heb helaas nog steeds geen datum of tijd begrepen. ` + 
                                `Ik verwacht bijvoorbeeld "morgen om 14:00" of "24 augustus om tien uur" of "ergens volgende week"`
                        ];
                    } else if (!date) {
                        responses = [
                            `Ik heb wel om ${helper.getLocaleTimeString(time)} begrepen, maar nog steeds geen datum. ` + 
                                `Ik verwacht bijvoorbeeld "morgen" of "24 augustus"`,
                            `Ik begrijp wel ${helper.getLocaleTimeString(time)}, maar ik heb nog steeds geen datum verstaan. ` + 
                                `Ik verwacht bijvoorbeeld "morgen" of "24 augustus"`
                        ];
                    } else if (!time) {
                        responses = [
                            `Ik heb ${helper.getLocaleDateString(date)} begrepen, maar nog steeds geen tijd. ` + 
                                `Ik verwacht bijvoorbeeld "om 10:00" of "om drie uur"`,
                            `Ik begrijp ${helper.getLocaleDateString(date)}, maar ik heb nog steeds geen tijd verstaan. ` + 
                                `Ik verwacht bijvoorbeeld "om 10:00" of "om drie uur"`
                        ];
                    }
                    break; 
                case 3:
                    if (!date || !time) {
                        responses = [
                            `Het lijkt erop dat ik niet slim genoeg ben om je antwoord te begrijpen. ` + 
                                `Laten we stoppen. Hopelijk tot de volgende keer!`,
                            `Ik lijk je helaas niet te kunnen begrijpen. ` + 
                                `Laten we dan maar stoppen. Hopelijk tot de volgende keer!`
                        ];
                    }
                    outContext = [{
                        'name': 'repair-appointment',
                        'lifespan': 0
                    }];
                    break;                                                               
                default:
                    throw new Error("fallbackCount has an unexpected value");
            }
        }  
        
        // Add responses and outgoing contexts
        const pick = Math.floor(Math.random() * responses.length);
        agent.add(responses[pick]);   
        for (let context of outContext) {
            agent.context.set(context);   
        } 
    } 

    return agent;
}

// Function to find a key in a list of dictionaries
var findKey = function(listOfDictionaries, string) {
    for (let key in listOfDictionaries) {
        if (listOfDictionaries[key].objects.includes(string)) {
            return key
        }
    }
    throw new Error('Key not found in list of dictionaries.')
}