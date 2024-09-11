// I MADE THIS FILE AS A STARTING POINT FOR CUSTOM WIDGETS IN STREAMELEMENTS.
// IT HAS SAMPLE CODE FOR DOING MOST THINGS YOU WOULD WANT FOR A TWITCH STREAM.
// FOR MORE INFORMATION AND EXAMPLES, SEE https://github.com/StreamElements/widgets

// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// VARIABLES FOR STREAMELEMENTS API
const SE_DATA_STORE_OBJECT_NAME = 'saveDataObj'; // Name of Object Store Variable
const forceClearAPI = false; // Change to true to delete the SE API Store data

// FIELD DATA VARIABLES
let secretKey; // JWT Token provided to authorise and send messages as the StreamElements Chat Bot

// WIDGET VARIABLES
let counterValue = 0; // An example value to display on the widget
let counterName = "deaths"; // An example of a SE Bot Counter
let textAlign = 'left'; // An example of a field data variable
let latestFollower, totalFollowers, latestSubscriber, totalSubscribers, latestTipper, latestCheerer, latestRaider;

// WIDGET SETTINGS
let widgetSetting = true; // An example of a setting to toggle something on/off

// CHAT COMMANDS
let chatCommandSymbol = '!'; // Prefix used for chat commands
let addCMD = chatCommandSymbol + 'add', removeCMD = chatCommandSymbol + 'remove', setCMD = chatCommandSymbol + 'set', resetCMD = chatCommandSymbol + 'reset';

// ANIMATOR
let shouldAnimate = false, playingAnimation = false;

// HTML ELEMENTS
const elementContainer = document.getElementById('container');
const elementText = document.getElementById('text');
const elementAnimation = document.getElementById('animation');


// Function To Make Changes To The Widget
function updateWidget() {

    if (widgetSetting === false) {

        // Hide widget if setting is off
        elementContainer.style.display = "none";

    } else {

        // Show widget if setting is on
        elementContainer.style.display = "block";

        // Display the HTML 
        elementText.innerHTML = "Counter = " + counterValue;
        elementAnimation.innerHTML = "+1";

        // Animate
        if (shouldAnimate === true && playingAnimation === false) {

            shouldAnimate = false;
            playingAnimation = true;

            // Reset Animation With Reflow
            elementAnimation.style.animation = 'none';
            elementAnimation.offsetHeight;
            elementAnimation.style.animation = null;

            // Show Animation
            elementAnimation.style.visibility = "visible";

            // Remove wheelspin after it has played
            setTimeout(function () {
                elementAnimation.style.visibility = "hidden";
                playingAnimation = false;
            }, 1000); // 1000ms = 1 second

        } else if (shouldAnimate === false && playingAnimation === false) {

            // Prevent wheelspin from stopping early/playing multiple times if many wheelspins are added
            elementAnimation.style.visibility = "hidden";

        }

        // Save changes to SE API Store
        let dataToSave = {
            counter: counter,
            widgetSetting: widgetSetting
        }
        saveData(dataToSave);

    }
}


// Function called each chat message
function handleChatMessage(eventData) {

    let shouldUpdateWidget = false;

    // Create a new object of chat message data for ease of use
    let messageData = {
        "username": eventData["displayName"].toLowerCase(), // Username but all lowercase 
        "displayName": eventData["displayName"], // Username who sent chat message
        "usernameColour": eventData["displayColor"], // Colour of the username
        "channel": eventData["channel"], // Channnel where message was sent
        "message": html_encode(eventData["text"]), // Santise chat message text
        "time": eventData["time"], // Timestamp of the message was sent
        "broadcaster": (eventData["displayName"].toLowerCase() === eventData["channel"]), // Check if user is the broadcaster
        "mod": parseInt(eventData["tags"]["mod"]), // Check if user is a moderator
        "subscriber": parseInt(eventData["tags"]["subscriber"]), // Checks if user is a subscriber
        "messageID": eventData["tags"]["id"], // Unique ID of the message (used for message deletion)
        "userID": eventData["userId"] // Unique ID of the user (used for message deletion)
    }

    // Only process chat command messages
    if (messageData.message.charAt(0) !== chatCommandSymbol) return false;

    // Handle message only if broadcater or moderator
    if (messageData.mod || messageData.broadcaster) {

        //Process chat command 
        let messageSplit = messageData.message.split(" ");


        if (messageSplit[0] == addCMD || messageSplit[0] == (addCMD + 's')) {

            // DETERMINE AMOUNT OF SUBS TO ADD IF GIVEN IN CHAT MESSAGE
            let toAdd = 1;

            if (!isNaN(parseInt(messageSplit[1]))) {
                toAdd = parseInt(messageSplit[1]);
            }

            if (toAdd <= 0) toAdd = 1;

            counterValue += Math.floor(toAdd);
            shouldUpdateWidget = true;
            shouldAnimate = true;
            sendBotChatMessage("Added " + Math.floor(toAdd) + " To Counter");

        } else if (messageSplit[0] == removeCMD || messageSplit[0] == (removeCMD + 's')) {

            // DETERMINE AMOUNT OF SUBS TO ADD IF GIVEN IN CHAT MESSAGE
            let toRemove = 1;

            if (!isNaN(parseInt(messageSplit[1]))) {
                toRemove = parseInt(messageSplit[1]);
            }

            if (toRemove <= 0) toRemove = 1;

            counterValue += Math.floor(-toRemove);
            shouldUpdateWidget = true;
            shouldAnimate = true;
            sendBotChatMessage("Removed " + Math.floor(toRemove) + " From Counter");

        } else if (messageSplit[0] == setCMD) {

            // DETERMINE AMONT OF SUBS TO SET VALUE TO IF GIVEN IN CHAT MESSAGE
            let toSet = counterValue;

            if (!isNaN(parseInt(messageSplit[1]))) {
                toSet = parseInt(messageSplit[1]);
            }

            if (toSet <= 0) toSet = 0;
            
            counterValue = Math.floor(toSet);
            shouldUpdateWidget = true;
            sendBotChatMessage("Set Counter to " + counterValue);

        } else if (messageSplit[0] === resetSubsCMD) {

            // RESET SUB COUNT TO ZERO
            subCounterValue = 0;
            shouldUpdateWidget = true;
            sendBotChatMessage("Reset Counter to 0");

        } 

        // Create a message for the bot to reply to the user with
        let replyMessage = "@" + messageData.displayName + ", added 1 to counter";

        // Send the message as the bot
        sendBotChatMessage(replyMessage);

    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function called each stream event
function handleStreamEvent(listener, event) {

    let shouldUpdateWidget = false;

    // Assign event common variables
    let username = '', displayname = '', amount = '', message = '';
    if (event.name !== undefined) username = event.name;
    if (event.displayName !== undefined) displayname = event.displayName;
    if (event.amount !== undefined) amount = event.amount;
    if (event.message !== undefined) message = html_encode(event.message);

    // NEW FOLLOWER
    if (listener === 'follower') {

        // Username is the new follower
        console.log("New Follower: ", displayname);

        shouldUpdateWidget = true;

    }

    // NEW SUBSCRIBER
    if (listener === 'subscriber') {

        // The event when it says 'X gifted Y subs'
        if (event.bulkGifted) {

            // Username is the gifter, Amount is number of gift subs
            console.log("New Gift Event: " + displayname + " gifted " + amount + ". Gift Msg: " + message)

            return; // This is only a message, actual subs come in subsequent events, don't update widget
        };

        // Normal Subscriber
        if (!event.gifted) {

            // Username is the subscriber, Amount is number of months subcribed
            console.log("New Sub: " + displayname + " for " + amount + " month(s). Sub Msg: " + message);

            // Gifted Subscription Subscriber
        } else {

            // Username is who got the subscription, Amount is number of months subscribed
            let gifterUsername = ''; // Who gifted the subscription
            if (event.sender !== undefined) gifterUsername = event.sender;
            console.log("New Gifted Sub: " + displayname + " got a sub from " + gifterUsername + ". They have subbed for " + amount + " months(s)");
        }

        shouldUpdateWidget = true;

    }
    
    // NEW CHEER
    if (listener === 'cheer') {

        // Username is the cheerer, amount is the cheer amount
        console.log("New Cheer: " + displayname + " cheered " + amount + "Cheer Msg: " + message);

        shouldUpdateWidget = true;

    }

    // NEW TIP
    if (listener === 'tip') {

        // Username is the tipper, amount is the amount tipped
        let currencyCode = userCurrency.code; // e.g. USD
        let currencySymbol = userCurrency.symbol; // e.g. $

        console.log("New Tip: " + currencySymbol + amount + ' ' + currencyCode + " from " + displayname + ". Tip Msg: " + message);

        shouldUpdateWidget = true;

    }

    // NEW RAID
    if (listener === 'raid') {

        // Username is the raider, Amount is the number of raiders
        console.log("New Raid: " + displayname + " raided the stream with " + amount + " raiders");

        shouldUpdateWidget = true;

    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function to ensure data structure of the save object is valid 
function validateSaveDataObject(objectToValidate) {

    // Create the default object
    const defaultSaveObject = {
        counter: 0,
        widgetSetting: true
    };

    // Create a new object identical to the default object
    let validatedObject = structuredClone(defaultSaveObject);

    // VALIDATE OBJECT VALUES

    // Check Value is a number
    if (!isNaN(parseInt(objectToValidate.counter))) {
        validatedObject.counter = parseInt(objectToValidate.counter);
    }

    // Check Value is Boolean
    if (objectToValidate.widgetSetting === true || objectToValidate.widgetSetting === false) {
        validatedObject.widgetSetting = objectToValidate.widgetSetting;
    }

    return validatedObject;

}

// Function to load and assign global variables to API Store data
function loadData(storedData) {

    if (storedData !== false) {

        // Check the data is what it should be
        let validatedObject = validateSaveDataObject(storedData);

        // Assign storeData from SE API Store to 
        counter = validatedObject.counter;
        widgetSetting = validatedObject.widgetSetting;

    } else {

        // Create an empty, default object to save into SE API Store
        saveData({});

    }

    // Make changes to the widget after data has loaded
    updateWidget();

}

// Function to save data to Api Store
function saveData(dataToSave) {

    // Validate the object, then save the object
    saveStateToSEAPI(validateSaveDataObject(dataToSave));

}

// Function to assign widget field data to global variables
function setFieldDataVariables() {

    // The JWT Token needs to be provided as field data. It is manually obtained from https://streamelements.com/dashboard/account/channels 
    secretKey = fieldData.secretKey; // Used to autheticate streamelements API calls)

    // Assign global variables to field data for ease of use
    textAlign = fieldData.textAlign;

    // Assign variables to useful data
    latestFollower = data["follower-latest"]["name"];
    totalFollowers = data["follower-total"]["count"];
    latestSubscriber = data["subscriber-latest"]["name"];
    totalSubscribers = data["subscriber-total"]["count"];
    latestTipper = data["tip-latest"]["name"];
    latestCheerer = data["cheer-latest"]["name"];
    latestRaider = data["raid-latest"]["name"];

}


//// STREAMELEMENTS WIDGET EVENTS ////

// THIS FUNCTION IS CALLED ONCE WHEN THE WIDGET IS FIRST LOADED
window.addEventListener('onWidgetLoad', function (obj) {

    // Data provided by streamelements. Assigned as global variables because they are only obtained during on load.
    channel = obj["detail"]["channel"]["username"]; // The channel name (broadcaster username)
    channelID = obj["detail"]["channel"]["id"]; // The channel ID (returned by `//api.streamelements.com/kappa/v2/channels/${channel}/`)
    data = obj["detail"]["session"]["data"]; // Contains a bunch of useful info about the channel
    apiToken = obj["detail"]["channel"]["apiToken"]; // This is the Overlay Token
    fieldData = obj["detail"]["fieldData"]; // Data input into the widget from fields (e.g. settings values)
    userCurrency = obj["detail"]["currency"]; // Currency data specified for donations

    // Assign Field Data to variables for ease of use 
    setFieldDataVariables(fieldData);

    // Retrieve data from SE API Store
    loadStateFromSEAPI();

});


// THIS FUNCTION IS CALLED EVERY STREAM EVENT
window.addEventListener('onEventReceived', function (obj) {

    // Return if there was no event
    if (!obj.detail.event) return;

    // Get information on the event
    const event = obj.detail.event;
    const listener = obj.detail.listener.split("-")[0];

    // Make changes based on the event
    if (listener === 'message') {

        // Handle the chat message
        handleChatMessage(event.data);

    } else {

        // Handle other stream events
        handleStreamEvent(listener, event);
    }

});



//// STREAMELEMENTS CHAT BOT ////

// FUNCTION TO SEND CHAT MESSAGES AS STREAMELEMENTS BOT
async function sendBotChatMessage(message) {

    // Send the chat message as the chat bot using SE's API
    const url = 'https://api.streamelements.com/kappa/v2/bot/' + channelID + '/say';
    const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json; charset=utf-8',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + secretKey
        },
        body: '{"message":"' + message + '"}'
    };

    try {
        // Make the API call
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);

    } catch (error) {

        console.error(error);

    }

}


//// STREAMELEMENTS DATA STORE ////


// FUNCTION TO SAVE DATA WITH SE API STORE
function saveStateToSEAPI(saveData) {

    // Create a single object that contains the data
    let saveObj = { data: saveData };

    // Reset the data stored (for debugging and issues)
    if (forceClearAPI === true) {
        console.log("Clearing API Store of " + SE_DATA_STORE_OBJECT_NAME);
        saveObj = {};
    }

    // Store the object
    console.log("Save", saveObj);
    SE_API.store.set(SE_DATA_STORE_OBJECT_NAME, saveObj);

}


// FUNCITON TO LOAD DATA FROM SE API STORE
async function loadStateFromSEAPI() {

    // Retrieve the stored object
    await SE_API.store.get(SE_DATA_STORE_OBJECT_NAME).then(obj => {

        if (obj !== null) {

            if (obj.data !== undefined) {

                // Load the saved data into the widget
                console.log("Load", obj);
                loadData(obj.data);

            } else {

                // The SE_DATA_STORE_OBJECT_NAME exists but data is not apart of the object (Should never really happen)
                console.log("Object '" + SE_DATA_STORE_OBJECT_NAME + "' exists but with no data in SE API Store");
                loadData(false);

            }

        } else {

            // The SE_DATA_STORE_OBJECT_NAME doesn't exist (Also maybe couldn't connect to the API?)
            console.log("Object '" + SE_DATA_STORE_OBJECT_NAME + "' does not exist in SE API Store");
            loadData(false);

        }

    });

}

// FUNCTION TO LOAD BOT COUNTER VALUE FROM SE API STORE
async function loadCounterFromSEAPI() {

    await SE_API.counters.get(counterName).then(counter => {
       
        if (counter !== null) {

            if (counter !== undefined) {

                counterValue = counter.count;

                // Make changes to the widget after data has loaded
                updateWidget();

            } else {
                console.log("could not get data for" + counterName)
            }

        } else {
            console.log(counterName + "does not exist")
        }

    });

}

//// UTILITY FUNCITONS ////

// FUNCTION TO SANITISE TEXT INPUTS
function html_encode(e) {

    return e.replace(/[\<\>\"\^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });

}