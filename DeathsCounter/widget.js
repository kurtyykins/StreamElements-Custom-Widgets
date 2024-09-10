// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// FIELD DATA VARIABLES
let counterName = '';

// WIDGET VARIABLES
let counterValue = 0;


// CHAT COMMANDS
let chatCommandSymbol = '!';
let showCounterCMD = chatCommandSymbol + 'showdeaths', hideCounterCMD = chatCommandSymbol + 'hidedeaths';

// HTML ELEMENTS
let settingShowCounter = true;
const elementMainContainer = document.getElementById('main-container')
const elementCounterText = document.getElementById('counterText');



// Function To Make Changes To The Widget
function updateWidget() {

    // Hide widget setting
    if (settingShowCounter === false) {

        elementMainContainer.style.display = "none";
    
    } else {

        elementMainContainer.style.display = "block";

        // Display the HTML 
        elementCounterText.innerHTML = `Y<img src="https://cdn.7tv.app/emote/6042089e77137b000de9e669/4x.webp">U DIED: ` + counterValue; 
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
    if (messageData.message.charAt(0) !== "!") return false;

    // Handle message only if broadcater or moderator
    if (messageData.mod || messageData.broadcaster) {

        if (messageData.message === showCounterCMD) {

            shouldUpdateWidget = true;
            settingShowCounter = true;

        } else if (messageData.message === hideCounterCMD) {

            shouldUpdateWidget = true;
            settingShowCounter = false;
            
        }

    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function called each stream event
function handleStreamEvent(listener, event) {

    let shouldUpdateWidget = false;

    // NEW FOLLOWER
    if (listener === 'bot:counter') {
        console.log(event);
        if (event.counter === counterName) {

            counterValue = event.value;
            shouldUpdateWidget = true;

        }
    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function to assign widget field data to global variables
function setFieldDataVariables() {

    // The JWT Token needs to be provided as field data. It is manually obtained from https://streamelements.com/dashboard/account/channels 
    secretKey = fieldData.secretKey; // Used to autheticate streamelements API calls)

    // Assign global variables to field data for ease of use
    counterName = fieldData.counterName;
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
    loadCounterFromSEAPI();

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


// FUNCITON TO LOAD DATA FROM SE API STORE
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