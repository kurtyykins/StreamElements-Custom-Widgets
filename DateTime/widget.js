// FOR MORE INFORMATION AND EXAMPLES, SEE https://github.com/StreamElements/widgets

// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// FIELD DATA VARIABLES
let secretKey; // JWT Token provided to authorise and send messages as the StreamElements Chat Bot

// WIDGET VARIABLES
let date, time;
let timezoneOffset = 0, hoursIs24 = true, hideDate = false, textAlign = 'center';
let timeoutInterval = null;
let interval = 250; //delay time in milliseconds, 1 s = 1000 ms

// CHAT COMMANDS
let chatCommandSymbol = '!'; // Prefix used for chat commands
let dateCMD = chatCommandSymbol + 'date', timeCMD = chatCommandSymbol + 'time';

// HTML ELEMENTS
const elementContainer = document.getElementById('container');
const elementDate = document.getElementById('date');
const elementTime = document.getElementById('time');



// Function To Make Changes To The Widget
function updateWidget() {

    // Show/hide the date
    if (hideDate) {
        elementDate.style.display = "none";
    } else {
        elementDate.style.display = "block";
    }

    // Countdown the time
    timeoutInterval = setInterval(function () {

        // Get Date/Time Now
        let timedateNowParsed = Date.now();
        let timedateAdjusted = timedateNowParsed + (timezoneOffset * 60 * 60 * 1000);
        let timedateNow = new Date(timedateAdjusted);

        let year = timedateNow.getFullYear();
        let month = (timedateNow.getMonth()+1);
        let day = timedateNow.getDate();
        let hour = timedateNow.getHours();
        let minutes = timedateNow.getMinutes();
        let seconds = timedateNow.getSeconds();

        let timeappend = ''
        if (!hoursIs24 && hour >= 13) {
            hour -= 12;
            timeappend = ' PM';
        } else if (!hoursIs24) {
            timeappend = ' AM';
        }

        // Add a 0 if only single digit
        if (month < 10) { month = '0' + month; }
        if (day < 10) { day = '0' + day; }
        if (hour < 10) { hour = '0' + hour; }
        if (minutes < 10) { minutes = '0' + minutes; }
        if (seconds < 10) { seconds = '0' + seconds; }

        date = year + '/' + month + '/' + day;
        time = hour + ':' + minutes + ':' + seconds + timeappend;

        elementDate.innerHTML = date;
        elementTime.innerHTML = time;

    }, interval);

}


// Function called each chat message
function handleChatMessage(eventData) {

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

    //Process chat command 
    let messageSplit = messageData.message.split(" ");

    if (messageSplit[0] == dateCMD) {

        sendBotChatMessage("@" + messageData.displayName + ", Date: " + date);

    } else if (messageSplit[0] == timeCMD) {

        sendBotChatMessage("@" + messageData.displayName + ", Time: " + time);

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
    timezoneOffset = fieldData.timezoneOffset;
    hoursIs24 = fieldData.hoursIs24  === 'true' ? true : false;
    hideDate = fieldData.hideDate  === 'true' ? true : false;
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