# CalendarBot
The fulfillment function (using functions in firebase) for the CalendarBot implemented in DialogFlow. This fulfillment handles the creation of an repair appointment in the calendar of a gmail service account.


## Setup Firebase for Cloud Functions
To install or update Firebase to the latest version (version 6.5.0 at the time of writing):

npm install -g firebase-tools@latest

firebase --version

Then you can login with your Google account: 

firebase login

To add an alias for the current project to avoid having to add this information later, you can select the project by typing:

firebase use --add


## To develop Firebase Functions locally (taken from [stackoverflow](https://stackoverflow.com/questions/48981817/actions-on-google-ngrok-running-fulfillment-locally))
First you simulate the deployment environment locally using "firebase serve". This allows you to print stuff to the console. Then you need to make a http tunnel with "ngrok" from the local port that firebase is using to a https address. This https address can then be used by the dialogflow agent for requests to the fulfillment function. 

*The three step process:*

Run "firebase serve --only functions" in, for instance, Windows Powershell. If you want to specify the port you can add "--port 5000" to the firebase serve command. The serve command simulates the deployment environment on your own machine. You need to be running node.js (6.11.5 preferred, since that is what runs on Firebase Cloud Functions), but you don't need to make any changes to your code.

It will report something like:

functions: webhook: http://localhost:5000/project-name/us-central1/function-name

Note the port number (after the "localhost" part). Use that as a parameter for ngrok in a new Powershell window with a command like "ngrok http 5000" (don't worry about the "http" part - it will make an https port available).

The ngrok console will start and will include a line like:

Forwarding https://zz99z999.ngrok.io -> localhost:5000

Now you'll need to combine the URL base from here and the path that firebase has told you for your webhook fulfillment url in Dialogflow. In our example, this would be:

https://zz99z999.ngrok.io/project-name/us-central1/function-name.


## Commit changes to Cloud Functions
Deploy the functions to using:

firebase deploy --only functions

## Some remarks based on experiences
- Do not use context names with capitals, they are converted to lower case by dialogflow.
- New parameters are automatically added to the contexts that are already present. This means you cannot use load a parameter from a context that has the same name as one that is matched in the most recent user utterance.
