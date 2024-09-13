// FOR MORE INFORMATION AND EXAMPLES, SEE https://github.com/StreamElements/widgets

// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// FIELD DATA VARIABLES
let secretKey; // JWT Token provided to authorise and send messages as the StreamElements Chat Bot

// WIDGET VARIABLES
let timerEndDate, timerEndTime, timezoneOffset
let timerText, hideDays = false, textAlign = 'center';
let countdownEndTime = null;
let timeRemaining = 0;
let timeoutInterval = null;
let interval = 250; //delay time in milliseconds, 1 s = 1000 ms

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

    // Calculate timer end date/time from Field Data
    if (countdownEndTime === null) {

        let splitDate = timerEndDate.split('-');
        let splitTime = timerEndTime.split(':');

        let endYear = splitDate[0];
        let endMonth = splitDate[1] - 1; // Months are counted from 0-11 not 1-12
        let endDay = splitDate[2];
        let endHour = splitTime[0];
        let endMin = splitTime[1];
        let endSec = splitTime[2];

        let countdownEndTimeTemp = new Date(endYear, endMonth, endDay, endHour, endMin, endSec); // Outputs as JS full string
        let countdownEndTimeParsed = Date.parse(countdownEndTimeTemp); // Converts string to milliseconds (Epoch)

        // Adjust millisecond time based on timezone offset (hours * 60min * 60sec * 1000ms)
        countdownEndTime = countdownEndTimeParsed + (timezoneOffset * 60 * 60 * 1000);

    }

    // Check data format is valid
    let validationDate = new Date(countdownEndTime);
    if (isNaN(validationDate.getTime())) {

        elementText.innerHTML = "&lt; Date/Time Format Error &gt;";
        return;

    } else {

        elementText.innerHTML = timerText;

    }

    // Calculate time remaining
    timeRemaining = countdownEndTime - Date.now()

    if (timeRemaining <= 0) {

        // Make 00's flash as timer is complete
        elementDays.classList.add("flashInOut");
        elementHours.classList.add("flashInOut");
        elementMins.classList.add("flashInOut");
        elementSecs.classList.add("flashInOut");
        return;

    }

    // Countdown the time
    timeoutInterval = setInterval(function () {

        // Keep recalculting the time
        timeRemaining = countdownEndTime - Date.now()
        let days = 0, hours = 0, minutes = 0, seconds = 0;

        // Stop the timer if ended
        if (timeRemaining <= 0) {

            // Make 00's flash as timer is complete
            elementDays.classList.add("flashInOut");
            elementHours.classList.add("flashInOut");
            elementMins.classList.add("flashInOut");
            elementSecs.classList.add("flashInOut");

            sendBotChatMessage("Countdown Timer Complete!")

            clearInterval(timeoutInterval);
            timeoutInterval = null;

        } else {

            // Stop Animation incase end is updated
            elementDays.classList.remove("flashInOut");
            elementHours.classList.remove("flashInOut");
            elementMins.classList.remove("flashInOut");
            elementSecs.classList.remove("flashInOut");

            // Calculate timer components
            days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
        }

        // Add a 0 if only single digit
        if (seconds < 10) { seconds = '0' + seconds; }
        if (minutes < 10) { minutes = '0' + minutes; }
        if (hours < 10) { hours = '0' + hours; }
        if (days < 10) { days = '0' + days; }

        // Hide days (if setting is enabled)
        if (days > 0 || hideDays === 'false') {
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

}


// Function called each chat message
function handleChatMessage(eventData) {


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