'use strict';

// Helper function for date, time and address
const helper = require("./helperFunctions");

// Load credentials
const credentials = require("./credentials.json");
const calendarId = credentials.calendarId;
const serviceAccount = credentials.serviceAccount;

// Load the API for Google Calendar
const {google} = require('googleapis');
const calendar = google.calendar('v3');

// Set up Google Calendar service account credentials
const serviceAccountAuth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: 'https://www.googleapis.com/auth/calendar'
  });

// Opening hours/days and holidays
const openingTime = '09:00';
const closingTime = '17:00';
const closedDays = [
    'zaterdag', 
    'zondag'
];
const holidays = [
    '01 januari 2019',
    '19 april 2019',
    '21 april 2019',
    '22 april 2019',
    '27 april 2019',
    '05 mei 2019',
    '30 mei 2019',
    '09 juni 2019',
    '10 juni 2019',
    '25 december 2019',
    '26 december 2019'
]

// Dialog definition
var createAppointment = function(agent, object, postalCode, houseNumber, date, time) {
    console.log('Creating an appointment');
    console.log({object, postalCode, houseNumber, date, time});


    // Initialization
    let responses, outContext, pick;

    // Date time from date and time strings
    const dateTimeStart = helper.convertParametersToDateTime(date, time);

    // Define the length of the appointment to be one hour.
    const appointmentDuration = 1;  
    const dateTimeEnd = helper.addHours(dateTimeStart, appointmentDuration);

    // String date and time
    const appointmentTimeString = helper.getLocaleTimeString(dateTimeStart);
    const appointmentDateString = helper.getLocaleDateString(dateTimeStart);

    // Check for opening hours
    const status = isClosed(dateTimeStart, dateTimeEnd);
    console.log({status});
    if (status) {
        if (status === "On holiday") { 
            responses = [
                `Volgens mijn gegevens is ${appointmentDateString} een ` + 
                    `feestdag. Kun je ook een andere datum en tijd geven?`
            ];
        } else if (status === "In weekend") {
            responses = [
                `Ik begrijp dat je een afspraak wilt maken op ${appointmentDateString}. ` + 
                    `Helaas zijn we gesloten op een ${helper.dateTimeToWeekday(dateTimeStart)}. ` + 
                    `Kun je ook op een andere datum en tijd?`
            ];
        } else {  // outside opening hours
            responses = [
                `Ik heb ${appointmentDateString} om ${appointmentTimeString} begrepen. ` + 
                    `Helaas zijn onze werktijden van ${openingTime} tot ${closingTime}, ` + 
                    `kun je ook op een andere datum en of tijd?`
            ];
        }
        // Add response and context
        pick = Math.floor(Math.random() * responses.length);
        agent.add(responses[pick]); 
        return agent;
    }

    // Check the availability of the time slot and set up an appointment if the time slot 
    // is available on the calendar
    return new Promise((resolve, reject) => {
        createCalendarEvent(dateTimeStart, dateTimeEnd, object, postalCode, houseNumber)
        .then((result) => {
            console.log({result});
            responses = [
                `Ik heb een afspraak voor je ingepland voor de reparatie van ${object} op ` + 
                    `${appointmentDateString} om ${appointmentTimeString}. op het adres met ` + 
                    `postcode ${postalCode} en huisnummer ${houseNumber}. ` + 
                    `Kan ik je nog ergens anders mee helpen?`,
                `Er staat een afspraak voor je ingepland voor de reparatie van ${object} op ` + 
                    `${appointmentDateString} om ${appointmentTimeString} op het adres met ` + 
                    `postcode ${postalCode} en huisnummer ${houseNumber}. ` + 
                    `Kan ik nog iets anders voor je doen?`,
            ];
            outContext = [{
                'name': 'repair-appointment',
                'lifespan': 0
            }, {
                'name': 'further-assistance',
                'lifespan': 5
            }];
            // Add response
            pick = Math.floor(Math.random() * responses.length);
            agent.add(responses[pick]); 
            for (let context of outContext) {
                agent.context.set(context);   
            }
            return resolve(agent);
        })
        .catch((error) => {
            console.log(error);
            responses = [
                `Sorry, er is geen monteur beschikbaar op ${appointmentDateString} om ` + 
                    `${appointmentTimeString}. Kun je ook op een andere datum en of tijd?`,
                `Er is helaas geen monteur beschikbaar op ${appointmentDateString} om ` + 
                    `${appointmentTimeString}. Kun je ook een andere datum en tijd gegeven?`,
            ];
            outContext = [{
                'name': 'create-appointment',
                'lifespan': 5
            }];
            // Add response and context
            pick = Math.floor(Math.random() * responses.length);
            agent.add(responses[pick]); 
            for (let context of outContext) {
                agent.context.set(context);   
            }
            return resolve(agent);
        })
        .catch((error) => {
            return reject(error);
        });
    });
}

// Dialog definition
var showAppointments = function(agent, periodStart, periodEnd, date) {
    console.log('Showing appointments');
    console.log({periodStart, periodEnd, date});

    // Date time from date and time strings
    let dateTimeStart, dateTimeEnd;
    if (date) {
        dateTimeStart = helper.convertParametersToDateTime(date, periodStart);
        dateTimeEnd = helper.convertParametersToDateTime(date, periodEnd);
    } else {
        dateTimeStart = helper.convertParametersToDateTime(periodStart, "xxxx-xx-xxT00:00:00+xx:xx");
        dateTimeEnd = helper.convertParametersToDateTime(periodEnd, "xxxx-xx-xxT23:59:59+xx:xx");
    }    

    // String date and time
    const timeStringStart = helper.getLocaleTimeString(dateTimeStart);
    const dateStringStart = helper.getLocaleDateString(dateTimeStart);
    const timeStringEnd = helper.getLocaleTimeString(dateTimeEnd);
    const dateStringEnd = helper.getLocaleDateString(dateTimeEnd);    

    // Check the availability of the time slot and set up an appointment if the time slot 
    // is available on the calendar
    return new Promise((resolve, reject) => {
        listCalendarEvents(dateTimeStart, dateTimeEnd).then((listOfAppointments) => {
            console.log({listOfAppointments});
            const responses = [
                `De volgende afspra(a)k(en) staan er momenteel ingepland van ` + 
                `${dateStringStart} om ${timeStringStart} tot ${dateStringEnd} om ${timeStringEnd}:`
            ];
            const outContext = [{
                'name': 'create-appointment',
                'lifespan': 5
            }];
            // Add response and context
            const pick = Math.floor(Math.random() * responses.length);
            agent.add(responses[pick]); 
            for (let context of outContext) {
                agent.context.set(context);   
            }
            // List all appointments
            for (const appointment of listOfAppointments) {
                agent.add(appointment); 
            }
            return resolve(agent);
        })
        .catch((error) => {
            console.log(error);
            responses = [
                `Sorry, er is geen monteur beschikbaar op ${appointmentDateString} om ` + 
                    `${appointmentTimeString}. Kun je ook op een andere datum en of tijd?`,
                `Er is helaas geen monteur beschikbaar op ${appointmentDateString} om ` + 
                    `${appointmentTimeString}. Kun je ook een andere datum en tijd gegeven?`,
            ];
            outContext = [{
                'name': 'create-appointment',
                'lifespan': 5
            }];
            // Add response and context
            pick = Math.floor(Math.random() * responses.length);
            agent.add(responses[pick]); 
            for (let context of outContext) {
                agent.context.set(context);   
            }
            return resolve(agent);
        })
        .catch((error) => {
            return reject(error);
        });
    });
}

// A function that checks for events in a specified time period and creates 
// one if no conflicts are found
var createCalendarEvent = function(dateTimeStart, dateTimeEnd, object, postalCode, houseNumber) {
    return new Promise((resolve, reject) => {
        calendar.events.list({  // List all events in the specified time period
            auth: serviceAccountAuth,
            calendarId: calendarId,
            timeMin: dateTimeStart.toISOString(),
            timeMax: dateTimeEnd.toISOString()
        }, (err, calendarResponse) => {
            // Check if there exists any event on the calendar given the specified the time period
            if (err || calendarResponse.data.items.length > 0) {
                reject(err || new Error('De gewenste tijd conflicteert met een andere afspraak.'));
            } else {
                // console.log(calendarResponse);
                // Create an event for the requested time period
                calendar.events.insert({ 
                    auth: serviceAccountAuth,
                    calendarId: calendarId,
                    resource: {
                        summary: `Reparatie van ${object}`,
                        start: {dateTime: dateTimeStart},
                        end: {dateTime: dateTimeEnd},
                        location: `${postalCode} - ${houseNumber}`
                    }
                }, (err, event) => {
                    if (err) { 
                        reject(err);
                    } else {
                        resolve(event);
                    }
                });
            }
        });
    });
}

// A function that checks for events in a specified time period creates a list of them
var listCalendarEvents = function(dateTimeStart, dateTimeEnd) {
    return new Promise((resolve, reject) => {
        calendar.events.list({  // List all events in the specified time period
            auth: serviceAccountAuth,
            calendarId: calendarId,
            timeMin: dateTimeStart.toISOString(),
            timeMax: dateTimeEnd.toISOString()
        }, (err, calendarResponse) => {
            // Check if there exists any event on the calendar given the specified the time period
            if (err) {
                reject(err);
            } else {
                // console.log({items: calendarResponse.data.items});
                // Create a list for the requested time period
                const listOfAppointments = [];
                for (const item of calendarResponse.data.items) {
                    listOfAppointments.push(
                        `${helper.getLocaleDateString(item.start.dateTime)} ` +
                        `${helper.getLocaleTimeString(item.start.dateTime)}: ` +
                        `${item.summary}`
                    );
                }
                console.log({list: listOfAppointments});
                resolve(listOfAppointments);
            }
        });
    });
}


// A function that checks if the suggested time slot is within opening hours.
function isClosed(startDateTime, endDateTime) {
    // console.log({
    //     startMinutes: helper.dateToMinutes(startDateTime),
    //     openingMinutes: helper.timeToMinutes(openingTime),
    //     endMinutes: helper.dateToMinutes(endDateTime),
    //     closingMinutes: helper.timeToMinutes(closingTime),
    //     weekday: helper.dateTimeToWeekday(startDateTime),
    //     date: helper.dateTimeToDateString(startDateTime)
    // });
    if (helper.dateToMinutes(startDateTime) < helper.timeToMinutes(openingTime)) {
        return "Before opening time";
    } else if (helper.dateToMinutes(endDateTime) > helper.timeToMinutes(closingTime)) {
        return "After closing time";
    } else if (closedDays.includes(helper.dateTimeToWeekday(startDateTime))) {
        return "In weekend";
    } else if (holidays.includes(helper.dateTimeToDateString(startDateTime))) {
        return "On holiday"
    } else {
        return false;
    }
}

// Export
module.exports = {
    createAppointment: createAppointment,
    showAppointments: showAppointments
};