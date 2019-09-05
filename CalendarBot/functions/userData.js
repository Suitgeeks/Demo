'use strict';

// Initialize user data
const userData = {}

// A function to set a key to a value in the user data of the current session
const set = function (sessionId, key, value) {
    if (!(sessionId in userData)) {
        userData[sessionId] = {};
    }
    userData[sessionId][key] = value;
}

// A function to get the value of a key in the user data of the current session
const get = function (sessionId, key) {
    if (sessionId in userData) {
        if (key) {
            return userData[sessionId][key];    
        } else {
            return userData[sessionId];
        }
        
    }
    return undefined;
}

// A function to remove a key in the user data of the current session
const rem = function (sessionId, key) {
    delete userData[sessionId][key];
}

exports.set = set;
exports.get = get;
exports.rem = rem;