# Recruitment-Bot
A bot that answers questions about HR and benefits and is able to show fitting vacancies from a database (json at the moment).

# On using Azure Functions and deployment
To make the bot work on Azure, deploy using webpack and to use the Test in Web Chat functionality on Azure, the right settings need to be set in the local settings and the Application Settings and Bot Management Settings on Azure. 

The local settings are stored in a file called `local.settings.json` in the root directory (not in the messages directory). The Application Settings and Bot Management Settings on Azure can be found in, respectively:

`Functions Bot` -> `App Service Settings` -> `Configuration`
`Functions Bot` -> `Bot management` -> `Settings`

## App ID and Web Chat endpoint
The correct App ID is fixed in the Bot Management Settings and can be found there. Make sure that the AppId and key are set correctly in the Application Settings on Azure. There can be duplicates generated (bug on Azure!?), so check for the correct key on https://apps.dev.microsoft.com. The duplicates (with a different App ID) can be removed.

The local settings can be simply fetched using the following command in a terminal:

`func azure functionapp fetch-app-settings recruitment-bot`

## Using webpack
To simulate the remote Azure Functions and deploy to Azure Functions, the source files need to be packed first using webpack.

To use restify and maybe other packages, add a script file called “webpack.config.js” to the root directory with the contents:

```
module.exports = function(config, webpack) {
    config.plugins.push(new webpack.DefinePlugin({ "global.GENTLY": false }));
    return config;
}
```

Then you can pack the source files in messages using the following command in the root directory (so not in the messages directory):

`funcpack -e './webpack.config' pack './'`

## Running locally
Now you can run the code locally in two ways:
- Using `func start` that uses the webpacked source files (so not the original files in messages). This reads in the local configuration `local.settings.json` from root in a variable called `process.env`.
- Using `node index` in the messages folder that does use the original source files. This does not read in the local configuration, so some variables are not available in `process.env`.

For both ways to work you need the right settings in `local.settings.json` in the root directory (not in the messages directory), as explained above. Then the following parts in `index.js` does the trick:

```
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
```

```
// Create the chat connector
let connector;
if (process.env['BotEnv']) {  // on Azure or using Functions Core Tools
    connector =  new botbuilder_azure.BotServiceConnector({
        appId: process.env['MicrosoftAppId'],
        appPassword: process.env['MicrosoftAppPassword'],
        openIdMetadata: process.env['BotOpenIdMetadata']
    });
} else {  // Direct coupling to emulator
    connector =  new builder.ChatConnector();  
}
```

```
// Create interface for request and response
if (process.env['BotEnv']) {  // on Azure or using Functions Core Tools
    module.exports = connector.listen();
} else {  // Direct coupling to emulator
    const restify = require('restify');
    const server = restify.createServer();
    server.listen(3978, function() {
        console.log('Bot listening to endpoint http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());  
}
```

## Deployment
When everything works simulating the Azure Functions environment locally, the webpacked files can be pushed to Azure using:

`func azure functionapp publish recruitment-bot`

To find the application name if one already is defined (here `recruitment-bot`) use:

`az functionapp list --output table`

