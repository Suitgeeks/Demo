'use strict';

// Needed for date manipulation
const moment = require('moment-timezone');

// Time zone settings
const timeZone = 'Europe/Amsterdam';
const locale = 'nl-NL';  

// A helper function that receives Dialogflow's 'date' OR 'time' parameters 
// and creates a Date instance.
function convertToDateTime(dateTimeString){
    process.stdout.write("\nconvertToDateTime:\ndateTime:\t" + dateTimeString + "\n");
    let dateTimeObj = new moment.tz(dateTimeString.split('+')[0], timeZone);
    // replace a time between 0:00 and 6:59 with a time between 12:00 and 18:59
    if (Number(dateTimeObj.locale(locale).format("H")) < 7) {
        dateTimeObj.add(12, 'hours');
    }
    process.stdout.write("Output:\t" + dateTimeObj.format() + "\n");
    return dateTimeObj;
}

// A helper function that receives Dialogflow's 'date' AND 'time' parameters 
// and creates a Date instance.
function convertParametersToDateTime(dateString, timeString){
    process.stdout.write("\nconvertParametersToDateTime:\ndateString:\t" + dateString + 
        "\ntimeString:\t" + timeString + "\n");
    let dateTimeObj = new moment.tz(dateString.split('T')[0] + 'T' + 
        timeString.split('T')[1].split('+')[0], timeZone);
    // replace a time between 0:00 and 6:59 with a time between 12:00 and 18:59
    if (Number(dateTimeObj.locale(locale).format("H")) < 7) {
        dateTimeObj.add(12, 'hours');
    }        
    process.stdout.write("Output:\t" + dateTimeObj.format() + "\n");
    return dateTimeObj;
}

// A helper function that adds the value of 'hoursToAdd' to the Date 
// instance 'startDateTime' and returns a new Data instance 'endDateTime.
function addHours(startDateTime, hoursToAdd){
    process.stdout.write("\naddHours:\nstartDateTime:\t" + startDateTime.format() + 
        "\nhoursToAdd:\t" + hoursToAdd + "\n");
    let endDateTime = startDateTime.clone().add(hoursToAdd, 'hours');
    process.stdout.write("Output:\t" + endDateTime.format() + "\n");
    return endDateTime;
}

// A helper function that converts the Date or string instance 'dateTime' into a string 
// that represents this time in Dutch.
function getLocaleTimeString(dateTime){
    let timeString;
    if (typeof dateTime === 'string' || dateTime instanceof String) {
        process.stdout.write("\n\ngetLocaleTimeString:\ndateTimeString:\t" + dateTime + "\n");
        timeString = convertToDateTime(dateTime).clone().locale(locale).format("HH:mm");
    } else {
        process.stdout.write("\n\ngetLocaleTimeString:\ndateTimeObj:\t" + dateTime.format() + "\n");
        timeString = dateTime.clone().locale(locale).format("HH:mm");
    }
    process.stdout.write("Output:\t" + timeString + "\n");
    return timeString;
}

// A helper function that converts the Date or string instance 'dateTime' into a string 
// that represents this date in Dutch. 
function getLocaleDateString(dateTime){
    let dateString;
    if (typeof dateTime === 'string' || dateTime instanceof String) {
        process.stdout.write("\n\ngetLocaleDateString:\ndateTimeString:\t" + dateTime + "\n");
        dateString = convertToDateTime(dateTime).clone().locale(locale).format("dddd, D MMMM YYYY");
    } else {
        process.stdout.write("\n\ngetLocaleDateString:\ndateTimeObj:\t" + dateTime.format() + "\n");
        dateString = dateTime.clone().locale(locale).format("dddd, D MMMM YYYY");
    }
    process.stdout.write("Output:\t" + dateString + "\n");
    return dateString;
}

// A helper function to convert a date to minutes from midnight
function dateToMinutes(dateTimeObj) {
    let timeString = dateTimeObj.clone().locale(locale).format("HH:mm");
    let hm = timeString.split(':');
    return Number(hm[0])*60 + Number(hm[1]);
}

// A helper function to convert a time string to minutes from midnight
function timeToMinutes(timeString) {
    let hm = timeString.split(':');
    return Number(hm[0])*60 + Number(hm[1]);
}

// A helper function to convert a date to day of the week
function dateTimeToWeekday(dateTimeObj) {
    let weekdayString = dateTimeObj.clone().locale(locale).format("dddd");
    return weekdayString;
}

// A helper function to convert a date to day of the week
function dateTimeToDateString(dateTimeObj) {
    let dateString = dateTimeObj.clone().locale(locale).format("DD MMMM YYYY");
    return dateString;
}

// Create a custom recognizer for a combination of postal codes and house numbers
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

module.exports = {
    addHours: addHours,
    convertToDateTime: convertToDateTime,
    convertParametersToDateTime: convertParametersToDateTime,
    getLocaleDateString: getLocaleDateString,
    getLocaleTimeString: getLocaleTimeString,
    dateToMinutes: dateToMinutes,
    timeToMinutes: timeToMinutes,
    dateTimeToWeekday: dateTimeToWeekday,
    dateTimeToDateString: dateTimeToDateString,
    addressRecognizer: addressRecognizer
};