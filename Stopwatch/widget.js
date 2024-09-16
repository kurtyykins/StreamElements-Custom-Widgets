// FOR MORE INFORMATION AND EXAMPLES, SEE https://github.com/StreamElements/widgets

// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// FIELD DATA VARIABLES
let secretKey; // JWT Token provided to authorise and send messages as the StreamElements Chat Bot

// WIDGET VARIABLES
let timerText, hideDays = false, textAlign = 'center';

let prevTime, elapsedTime = null;
let stopwatchIsRunning = false;
let timeoutInterval = null;
let interval = 250; //delay time in milliseconds, 1 s = 1000 ms

// CHAT COMMANDS
let chatCommandSymbol = '!';
let startTimerCMD = chatCommandSymbol + 'starttimer', pauseTimerCMD = chatCommandSymbol + 'pausetimer', resetTimerCMD = chatCommandSymbol + 'resettimer';

// HTML ELEMENTS
const elementContainer = document.getElementById('container');
const elementText = document.getElementById('text');
const elementTimer = document.getElementById('timer');
const elementDays = document.getElementById('days');
const elementHours = document.getElementById('hours');
const elementMins = document.getElementById('mins');
const elementSecs = document.getElementById('secs');
const elementDaysBox = document.getElementById('days-box');
const elementDaysColon = document.getElementById('days-colon');


// Function To Make Changes To The Widget
function updateWidget() {

    // Align the timer boxes with the text
    if (textAlign === 'left') {
        elementTimer.style.justifyContent = 'flex-start';
    } else if (textAlign === 'right') {
        elementTimer.style.justifyContent = 'flex-end';
    } else {
        elementTimer.style.justifyContent = 'center';
    }

    // Hide days (if setting is enabled)
    if (hideDays === false) {
        elementDaysBox.style.display = 'flex';
        elementDaysColon.style.display = 'flex';
    } else {
        elementDaysBox.style.display = 'none';
        elementDaysColon.style.display = 'none';
    };


    let days = 0, hours = 0, minutes = 0, seconds = 0;

    if (stopwatchIsRunning === true) {

        timeoutInterval = setInterval(function () {

            if (!prevTime) { prevTime = Date.now(); }

            elapsedTime += Date.now() - prevTime;
            prevTime = Date.now();


            // Calculate timer components
            days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
            hours = Math.floor((elapsedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
            seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
        

            // Add a 0 if only single digit
            if (seconds < 10) { seconds = '0' + seconds; }
            if (minutes < 10) { minutes = '0' + minutes; }
            if (hours < 10) { hours = '0' + hours; }
            if (days < 10) { days = '0' + days; }

            // Hide days (if setting is enabled)
            if (days > 0 || hideDays === false) {
                elementDaysBox.style.display = 'flex';
                elementDaysColon.style.display = 'flex';
            } else {
                elementDaysBox.style.display = 'none';
                elementDaysColon.style.display = 'none';
            };

            // Output Text
            elementDays.innerHTML = days;
            elementHours.innerHTML = hours;
            elementMins.innerHTML = minutes;
            elementSecs.innerHTML = seconds;
        }, interval);
    } else if (elapsedTime === 0) {

            // Output Text
            elementDays.innerHTML = '00';
            elementHours.innerHTML = '00';
            elementMins.innerHTML = '00';
            elementSecs.innerHTML = '00';

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

        if (messageSplit[0] == startTimerCMD && stopwatchIsRunning === false) {

            elementText.innerHTML = '';
            sendBotChatMessage("Stopwatch Started");

            stopwatchIsRunning = true;
            shouldUpdateWidget = true;

        } else if (messageSplit[0] == pauseTimerCMD && stopwatchIsRunning === true) {

            elementText.innerHTML = "Timer Paused";
            sendBotChatMessage("Stopwatch Paused");

            clearInterval(timeoutInterval);
            timeoutInterval = null;

            prevTime = 0;

            stopwatchIsRunning = false;
            shouldUpdateWidget = true;


        } else if (messageSplit[0] == resetTimerCMD) {

            elementText.innerHTML = 'Timer Reset';
            sendBotChatMessage("Stopwatch Reset");

            clearInterval(timeoutInterval);
            timeoutInterval = null;

            elapsedTime = 0;
            prevTime = 0;

            stopwatchIsRunning = false;
            shouldUpdateWidget = true;

        }
    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function called each stream event
function handleStreamEvent(listener, event) {


}

// Function to assign widget field data to global variables
function setFieldDataVariables() {

    // The JWT Token needs to be provided as field data. It is manually obtained from https://streamelements.com/dashboard/account/channels 
    secretKey = fieldData.secretKey; // Used to autheticate streamelements API calls)

    // Assign global variables to field data for ease of use
    timerEndDate = fieldData.timerEndDate;
    timerEndTime = fieldData.timerEndTime;
    timezoneOffset = fieldData.timezoneOffset;
    timerText = fieldData.timerText;
    hideDays = fieldData.hideDays === 'true' ? true : false;
    textAlign = fieldData.textAlign;

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

    // UpdateWidget
    updateWidget();

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

//// UTILITY FUNCITONS ////

// FUNCTION TO SANITISE TEXT INPUTS
function html_encode(e) {

    return e.replace(/[\<\>\"\^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });

}