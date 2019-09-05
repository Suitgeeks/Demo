"use strict";

var responses = {};

responses.welcome = ["Hi, I am the Super Recruiter. I can do many amazing things. What can I help you with?"];

responses.greeting = ["Hello, how are you doing? How can I assist you?"];

responses.didNotUnderstand = ["I'm sorry, I did not understand that. Please try again."];

responses.vacationFullTime = ["All full-time employees (except interns) have a total of 27 vacation days " + 
    "per calendar year. In January you will receive these vacation days as a deposit for the predicted hours " + 
    "for the upcoming calendar year. "];
responses.vacationPartTime = ["Part-time employees build up to 27 vacation days (for full time) based on the " + 
    "amount of hours they are expected to work in the upcoming calendar year."];
responses.vacationJobType = ["Are you interested in the vacation days for a full-time or a part-time job?"];

responses.workingHoursFullTime = ["Fulltime employees are expected to work 40 hours per week and 8 hours per day. " +
    "These hours should be made between eight AM and six PM. Commuting time and a half-hour lunchtime are excluded " +
    "from the working hours."];
responses.workingHoursPartTime = ["Working less than 40 hours per week is possible if the position allows it. " + 
    "This can be discussed between you the employee and us the employer. Unless otherwise agreed, employees " + 
    "are expected to work 8 hours per day between eight AM and six PM. Commuting time and a half-hour lunchtime " +
    "are excluded, from the working hours."];
responses.workingHoursJobType = ["Are you interested in the working hours for a full-time or a part-time job?"];

responses.aboutMe = ["I can do very many amazing things, such as answering questions about Data Analytics, an " + 
    "Ortec Finance Company, and its current vacancies. What can I help you with?"];

responses.addressPrompt = ["What is your home address?"];
responses.addressReprompt = ["I don't appear to understand the address. " + 
    "Can you formulate it as *street* *house_number*, *city*(, *country*)?"];
responses.addressConfirmation = ["I found the following address:\n*<<adress>>*\nIs this correct?"];

responses.vacanciesConfirmAddress = ["Is your address <<address>>?"];
responses.vacanciesConfirmFunctionType = ["Are you looking for vacancies in <<functionType>>?"];
responses.vacanciesFunctionType = ["What kind of vacancy are you looking for?"];
responses.vacanciesPrompt = ["Which of the following vacancies would you like to look into?"];
responses.vacanciesList = ["I found the following matching vacancies:\n<<vacancies>>"];
responses.vacanciesSelection = ["Here are the details:\n\n<<selection>>\n\n" + 
    "What would you like to do now?"];
responses.vacanciesNone = ["Unfortunately, I have not found any matching vacancies. Can I help you with anything else?"];

module.exports = responses;