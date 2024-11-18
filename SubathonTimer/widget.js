// FOR MORE INFORMATION AND EXAMPLES, SEE https://github.com/StreamElements/widgets

// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// VARIABLES FOR STREAMELEMENTS API
const SE_DATA_STORE_OBJECT_NAME = 'subathonTimerSaveDataObj'; // Name of Object Store Variable
const forceClearAPI = false; // Change to true to delete the SE API Store data

// FIELD DATA VARIABLES
let secretKey; // JWT Token provided to authorise and send messages as the StreamElements Chat Bot

// WIDGET VARIABLES
let storedTimeToAdd = 0; // DateTime (in milliseconds) to be added. Used to calculate the end DateTime in the future from Date.now(). Stores time remaining when timer gets paused (Stored in the SE DATA STORE)
let countdownEndTime = 0; // DateTime (in milliseconds) the count down should end at. Timer calculates difference from Date.now(). (Stored in the SE DATA STORE)
let subathonCapTime = null; // DateTime the count down should end at if subathon is capped. Prevents countdownEndTime from exceeding this value
let subathonHasStarted = false; // Has the timer started or been reset. (Stored in the SE DATA STORE)
let subathonHasEnded = false; // Has the timer ran to zero
let subathonHasCapped = false; // Has the subathon reached the cap
let timerIsRunning = false; // Is the timer enabled and currently counting down. (Stored in the SE DATA STORE)
let happyHour = false; // Doubles the time added for a set duration (1 hour = 3600000 ms)

// WIDGET SETTINGS
let timePerTier1Sub, timePerTier2Sub, timePerTier3Sub, timePerTip, timePerCheer, timePerFollow, timePerRaider; // Time values that gets added
let subathonStartDuration, subathonCapped, subathonCapEndDate, subathonCapEndTime, timezoneOffset, playSFX; // Subathon settings

// CHAT COMMANDS
let chatCommandSymbol = '!'; // Prefix used for chat commands
let startCMD = chatCommandSymbol + 'subathonstart', pauseCMD = chatCommandSymbol + 'subathonpause';
let addTimeCMD = chatCommandSymbol + 'subathonadd', removeTimeCMD = chatCommandSymbol + 'subathonremove';
let resetTimeCMD = chatCommandSymbol + 'subathonreset'; // Sets timer to the starting duration
let infoCMD = chatCommandSymbol + 'subathon'; // Shows information about the subathon
let happyHourCMD = chatCommandSymbol + 'happyhour'; // Toggles happy hour

// ANIMATOR
let timerInterval = null, interval = 250; // Timer SetInterval variables in milliseconds, 1 s = 1000 ms
let streamEvents = []; // Stores a queue of the time added stream events to display each
let animationTimeout = null, animationDuration = 4000; // Animation SetTimeout variables in milliseconds, 1 s = 1000 ms (Duration set in fielddata)
let happyHourTimeout = null, happyHourDuration = 3600000, happyHourEndTime = ''; // Animation SetTimeout variables in milliseconds,  1 hour = 3600000 ms (Duration set in fielddata) 

// WIDGET ELEMENTS
const elementContainer = document.getElementById('container');
const elementText = document.getElementById('infoText');
const elementEventLabel = document.getElementById('eventLabel');
const elementEventTime = document.getElementById('eventTime');

// TIMER ELEMENTS 
const elementTimer = document.getElementById('timer');
const elementDays = document.getElementById('days');
const elementHours = document.getElementById('hours');
const elementMins = document.getElementById('mins');
const elementSecs = document.getElementById('secs');
const elementDaysBox = document.getElementById('days-box');
const elementDaysColon = document.getElementById('days-colon');

// SOUNDS
let timerAddSFX = document.getElementById('timerAddSFX');
let timerAddSFXSource = document.getElementById('timerAddSFXSource');
let previousWheelSfxNum = 0;
let previousTimeAddedSfxNum = 0;
let timeAddedSfxSrcArray = [
    "https://i.imgur.com/yIQ6qL3.mp4",
    "https://i.imgur.com/pfErg0M.mp4",
    "https://i.imgur.com/928GFdf.mp4",
    "https://i.imgur.com/I58FtAc.mp4",
    "https://i.imgur.com/r3Ooxi3.mp4",
    "https://i.imgur.com/UYcELHy.mp4",
    "https://i.imgur.com/6JRN6Ra.mp4"
];


// Function To Make Changes To The Widget
function updateWidget() {

    // Prevent timer from running if subathon has not started
    if (!subathonHasStarted) { timerIsRunning = false; };

    // Calculate subathon cap end date/time from Field Data
    if (subathonCapTime === null) {

        // Generate date as full JS string, then parse into milliseconds. (Months are counted from 0-11 not 1-12)
        let splitDate = subathonCapEndDate.split('-'), splitTime = subathonCapEndTime.split(':');
        let subathonCapTimeTemp = new Date(splitDate[0], (splitDate[1] - 1), splitDate[2], splitTime[0], splitTime[1], splitTime[2]); 
        let subathonCapTimeParsed = Date.parse(subathonCapTimeTemp);

        // Adjust millisecond time based on timezone offset (hours * 60min * 60sec * 1000ms)
        subathonCapTime = subathonCapTimeParsed + (timezoneOffset * 60 * 60 * 1000);

    }

    // Check cap date formate is valid, doesn't update until user fixes and reloads if capped
    let validationDate = new Date(subathonCapTime);
    if (subathonCapped && isNaN(validationDate.getTime())) {
        elementText.innerHTML = '&lt; Date/Time Format Error &gt;';
        return; 
    }

    // Timer should countdown
    if (timerIsRunning){

        // Calculate the new end time from the stored time and reset the time to add.
        countdownEndTime += storedTimeToAdd;
        storedTimeToAdd = 0;

        // If the end time goes beyond the cap, clamp it to the cap
        if (countdownEndTime >= subathonCapTime && subathonCapped) {
            countdownEndTime = subathonCapTime;
            elementText.innerHTML = 'Subathon Cap Reached';
            subathonHasCapped = true;
        } else {
            subathonHasCapped = false;
        }

        // Keep showing the time (if not already running)
        if (timerInterval === null) {
            timerInterval = setInterval(function () {
                displayTimer(countdownEndTime);
            }, interval);
        }

    // Timer is not running
    } else if (!timerIsRunning && !subathonHasEnded) {

        // Stop the count if timer is running
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Add starting time if reset
        if (!subathonHasStarted && countdownEndTime === 0) {
            storedTimeToAdd = subathonStartDuration * 1000;
            elementText.innerHTML = '&lt; Timer Reset &gt;';
        } else {
            elementText.innerHTML = 'Subathon Timer Paused';
        }

        // Add time but don't reset stored time or change countdownEndtime
        let endTime = Date.now() + storedTimeToAdd;

        // If the end time goes beyond the cap, clamp it to the cap
        if (endTime >= subathonCapTime && subathonCapped) {
            endTime = subathonCapTime;
            elementText.innerHTML = 'Subathon Cap Reached';
            subathonHasCapped = true;
        } else {
            subathonHasCapped = false;
        }

        // Show time and update whenever widget updates
        displayTimer(endTime);

    }

    // Show the stream events from the queue
    if (streamEvents.length > 0 && animationTimeout === null && subathonHasStarted) {
        showStreamEvents();
    }

    // Save changes to SE API Store
    let dataToSave = {
        countdownEndTime: countdownEndTime,
        storedTimeToAdd: storedTimeToAdd,
        subathonHasStarted: subathonHasStarted,
        timerIsRunning: timerIsRunning
    }
    saveData(dataToSave);

}

function displayTimer(endTime) {

    // Calculting the time remaining
    let timeRemaining = endTime - Date.now();

    // End the timer if no time remaining
    if (timeRemaining <= 0) {
        finishTime();
        timeRemaining = 0;
    }

    // Calculate timer components
    let formattedTime = convertSecondsToTime(timeRemaining);

    // Output Text
    elementDays.innerHTML = formattedTime.days;
    elementHours.innerHTML = formattedTime.hours;
    elementMins.innerHTML = formattedTime.minutes;
    elementSecs.innerHTML = formattedTime.seconds;

}

function startTimer() {

    // Calculate the end time from the current time, adding any pause time back
    countdownEndTime = Date.now() + storedTimeToAdd;
    storedTimeToAdd = 0;

    // Redo messages
    if (happyHour) {
        elementText.innerHTML = happyHourEndTime;
    } else {
        elementText.innerHTML = '&nbsp;';
    }

    // Set widget state
    subathonHasStarted = true;
    timerIsRunning = true;

}

function pauseTime() {

    // Store time remaining to add back when unpaused
    storedTimeToAdd = countdownEndTime - Date.now();

    // Set widget state
    subathonHasStarted = true;
    timerIsRunning = false;

}

function finishTime() {

    elementText.innerHTML = 'Subathon Finished o7';
    sendBotChatMessage("Subathon Finished o7");

    // Make 00's flash as timer is complete
    elementDays.classList.add("flashInOut");
    elementHours.classList.add("flashInOut");
    elementMins.classList.add("flashInOut");
    elementSecs.classList.add("flashInOut");

    // Clear time
    storedTimeToAdd = 0;
    countdownEndTime = 0;

    // Set Widget State
    timerIsRunning = false;
    subathonHasStarted = true;
    subathonHasEnded = true;

    // Clear Interval
    clearInterval(timerInterval);
    timerInterval = null;

}

function resetTime() {

    // Clear time
    storedTimeToAdd = 0;
    countdownEndTime = 0;

    // Set Widget State
    timerIsRunning = false;
    subathonHasStarted = false;
    subathonHasEnded = false;

    // Clear Happy Hour Timeout
    happyHour = false;
    clearTimeout(happyHourTimeout);
    happyHourTimeout = null;

    // Clear Stream Events Animation Timeout
    streamEvents = [];
    clearTimeout(animationTimeout);
    animationTimeout = null;

    // Make 00's stop flashing
    elementDays.classList.remove("flashInOut");
    elementHours.classList.remove("flashInOut");
    elementMins.classList.remove("flashInOut");
    elementSecs.classList.remove("flashInOut");

}

function changeTime(type, name, time) {

    console.log("ChangeTime: ", type, name, time);

    if (!subathonHasEnded) {

        // Push the change in time to the stored time variable
        storedTimeToAdd += time;
        if (happyHour && type !== 'chat') { storedTimeToAdd += time };

        // Format the time to display
        let timeText = '+';
        if (time < 0) { timeText = '-' };

        // Calculate timer components
        let newTime = Math.abs(time);
        let formattedTime = convertSecondsToTime(newTime);

        // Format time
        if (formattedTime.days !== '00') { timeText += formattedTime.days + ':'; }
        if (formattedTime.hours !== '00') { timeText += formattedTime.hours + ':'; }
        timeText += formattedTime.minutes + ':' + formattedTime.seconds;

        // Add the event to the array
        streamEvents.push({type: type, name: name, time: timeText});
        if (happyHour && type !== 'chat') { streamEvents.push({type: 'HAPPY HOUR', name: ' x2 :)', time: timeText}); }

    }

}

function showStreamEvents() {

    console.log("EventQueue: ", streamEvents);
    
    if (streamEvents.length > 0) {

        // Reset Animation With Reflow
        elementEventLabel.style.animation = 'none';
        elementEventTime.style.animation = 'none';  
        elementEventLabel.offsetHeight;
        elementEventTime.offsetHeight;
        elementEventLabel.style.animation = null;
        elementEventTime.style.animation = null;

        // Show the elements
        if (!subathonHasCapped) { elementEventTime.style.visibility = 'visible'; }
        elementEventLabel.innerHTML = streamEvents[0].type + ': ' + streamEvents[0].name;
        elementEventTime.innerHTML = streamEvents[0].time;
        
        // Play SFX
        if (playSFX && timeAddedSfxSrcArray.length > 0) {

            let num = 0;
            // Don't play same sound back to back
            if (timeAddedSfxSrcArray.length > 1) {
                while (num === previousTimeAddedSfxNum) {
                    num = randomNumber(0, (timeAddedSfxSrcArray.length - 1));
                }
                previousTimeAddedSfxNum = num;
            }

            timerAddSFXSource.setAttribute('src', timeAddedSfxSrcArray[num]);
            timerAddSFX.pause();
            timerAddSFX.load();
            timerAddSFX.play();

        };

        
        // Iterate to display all the events in the array
        animationTimeout = setTimeout(function () {

            // Show the next event in the queue
            streamEvents.shift();
            elementEventLabel.innerHTML = '&nbsp;';
            elementEventTime.innerHTML = '&nbsp;';
            elementEventTime.style.visibility = 'hidden';
            showStreamEvents();

        }, animationDuration);

    } else {

        // Timeout animation early
        clearTimeout(animationTimeout);
        animationTimeout = null;

    }

}

function handleHappyHour() {

    // Enable Happy Hour
    if (!happyHour) {

        sendBotChatMessage("Subathon Happy Hour Started :)");
        happyHour = true;

        // Get and display end time of happy hour
        let happyHourEnd = new Date(Date.now() + happyHourDuration + (timezoneOffset * 60 * 60 * 1000));
        happyHourEndTime = 'Happy Hour Until: ';
        happyHourEndTime += (happyHourEnd.getHours() < 10 ? '0' : '') + happyHourEnd.getHours();
        happyHourEndTime += ':';
        happyHourEndTime += (happyHourEnd.getMinutes() < 10 ? '0' : '') + happyHourEnd.getMinutes();
        elementText.innerHTML = happyHourEndTime;

        // End happy hour after the duration
        happyHourTimeout = setTimeout(function () {
        
            sendBotChatMessage("Subathon Happy Hour Ended :(");
            happyhour = false;

            // Reset Text
            elementText.innerHTML = '&nbsp;';
            happyHourEndTime = '';
            clearTimeout(happyHourTimeout);
            happyHourTimeout = null;

        }, happyHourDuration);


    } else {

        // Disable Happy Hour Early
        sendBotChatMessage("Subathon Happy Hour Ended :(");
        happyHour = false;
        elementText.innerHTML = '&nbsp;';
        happyHourEndTime = '';
        clearTimeout(happyHourTimeout);
        happyHourTimeout = null;
        
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

        if (messageSplit[0] == startCMD && !timerIsRunning) {

            startTimer();
            sendBotChatMessage("Subathon Timer Started");
            shouldUpdateWidget = true;

        } else if (messageSplit[0] == pauseCMD && timerIsRunning) {

            pauseTime();
            sendBotChatMessage("Subathon Timer Paused");
            shouldUpdateWidget = true;

        } else if (messageSplit[0] == addTimeCMD && subathonHasStarted) {

            let timeAdded = 0;

            if (!isNaN(parseInt(messageSplit[1]))) {
                timeAdded = parseInt(messageSplit[1]);
            }

            if (timeAdded > 0) {
                changeTime('chat', messageData.username, (Math.floor(timeAdded) * 1000));
                if (!subathonHasEnded) { sendBotChatMessage("Added " + timeAdded + " seconds to Subathon Timer"); }
                shouldUpdateWidget = true;
            }

        } else if (messageSplit[0] === removeTimeCMD && subathonHasStarted) {

            let timeRemoved = 0;

            if (!isNaN(parseInt(messageSplit[1]))) {
                timeRemoved = parseInt(messageSplit[1]);
            }

            if (timeRemoved > 0) {
                changeTime('chat', messageData.username, -(Math.floor(timeRemoved) * 1000));
                if (!subathonHasEnded) { sendBotChatMessage("Removed " + timeRemoved + " seconds to Subathon Timer"); }
                shouldUpdateWidget = true;
            }

        } else if (messageSplit[0] === resetTimeCMD) {

            resetTime();
            sendBotChatMessage("Reset Subathon Timer");

            streamEvents = [];
            clearTimeout(animationTimeout);
            animationTimeout = null;

            shouldUpdateWidget = true;

        } else if (messageSplit[0] === infoCMD) {

            // Reply in chat with a bunch of information about the subathon
            let infoMessage = "";
            if (subathonCapped) { infoMessage += 'Capped at ' + subathonCapEndDate + ' ' + subathonCapEndTime + ' | '; }
            if (timePerFollow > 0) { infoMessage += 'Follow = ' + timePerFollow + 's | '; }
            infoMessage += 'T1 Sub = ' + timePerTier1Sub + 's | T2 Sub = ' + timePerTier2Sub + 's | T3 Sub = ' + timePerTier3Sub + 's';
            infoMessage += ' | $1 = ' + timePerTip + 's | 100 bits = ' + timePerCheer + 's';
            if (timePerRaider > 0) { infoMessage += ' | 1 Raider = ' + timePerRaider + 's'; }
            sendBotChatMessage(infoMessage);

        } else if (messageSplit[0] === happyHourCMD && subathonHasStarted) {

            handleHappyHour();
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

    let shouldUpdateWidget = false;

    // Assign event common variables
    let username = '', displayname = '', amount = '', message = '', tier = '', giftsender = '';
    if (event.name !== undefined) username = event.name;
    if (event.displayName !== undefined) displayname = event.displayName;
    if (event.amount !== undefined) amount = event.amount;
    if (event.message !== undefined) message = html_encode(event.message);
    if (event.tier !== undefined) tier = event.tier;
    if (event.sender !== undefined) giftsender = event.sender;

    let eventType = '', eventName = '', eventTime = '';

    // Only process events if the subathon has been started
    // Will work if paused, but not if reset
    if (subathonHasStarted) {

        // NEW FOLLOWER
        if (listener === 'follower' && timePerFollow !== 0) {
            eventType = "follow";
            eventName = username;
            eventTime = (timePerFollow * 1000);            
            shouldUpdateWidget = true;   
        }

        // NEW SUBSCRIBER
        if (listener === 'subscriber') {

            // The event when it says 'X gifted Y subs'
            if (event.bulkGifted) { return; };

            // Set default, T1 sub timer changes
            eventType = 'sub'
            eventName = username;
            eventTime = (timePerTier1Sub * 1000);

            // Gifted Sub
            if (event.gifted) {
                eventName = giftsender;
                eventType = 'gift'
            }

            // Check tier of Sub, change time to add and append tier to type
            if (tier === "2000") {
                eventTime = (timePerTier2Sub * 1000);
                eventType += ' t2';
            } else if (tier === "3000") {
                eventTime = (timePerTier3Sub * 1000);
                eventType += ' t3';
            }

            shouldUpdateWidget = true;

        }
        
        // NEW CHEER
        if (listener === 'cheer' && timePerCheer !== 0) {

            // Only count cheers in 100 intervals and round down amount to an integer
            if (100 <= amount) {
                eventType = "cheer";
                eventName = username;
                eventTime = (Math.floor(amount / 100) * (timePerCheer * 1000));  
                shouldUpdateWidget = true;
            }

        }

        // NEW TIP
        if (listener === 'tip' && timePerTip !== 0) {

            // Only count tips more than $1 and round down amount to an integer
            if (1 <= amount) {
                eventType = "tip";
                eventName = username;
                eventTime = (Math.floor(amount) * (timePerTip * 1000));  
                shouldUpdateWidget = true;
            }

        }

        // NEW RAID
        if (listener === 'raid' && timePerRaider !== 0) {

            // Only if there is more than 1 raider
            if (2 <= amount) {
                eventType = "tip";
                eventName = username;
                eventTime = (amount * (timePerRaider * 1000));  
                shouldUpdateWidget = true;
            }

        }
    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        
        changeTime(eventType, eventName, eventTime);
        updateWidget();

    }

}

// Function to ensure data structure of the save object is valid 
function validateSaveDataObject(objectToValidate) {

    // Create the default object
    const defaultSaveObject = {
        countdownEndTime: 0,
        storedTimeToAdd: 0,
        subathonHasStarted: false,
        timerIsRunning: false
    };

    // Create a new object identical to the default object
    let validatedObject = structuredClone(defaultSaveObject);

    // VALIDATE OBJECT VALUES

    // Check Values are numbers
    if (!isNaN(parseInt(objectToValidate.countdownEndTime))) {
        validatedObject.countdownEndTime = parseInt(objectToValidate.countdownEndTime);
    }

    if (!isNaN(parseInt(objectToValidate.storedTimeToAdd))) {
        validatedObject.storedTimeToAdd = parseInt(objectToValidate.storedTimeToAdd);
    }

    // Check values are boolean
    if (objectToValidate.subathonHasStarted === false || objectToValidate.subathonHasStarted === true) {
        validatedObject.subathonHasStarted = objectToValidate.subathonHasStarted;
    }

    if (objectToValidate.timerIsRunning === false || objectToValidate.timerIsRunning === true) {
        validatedObject.timerIsRunning = objectToValidate.timerIsRunning;
    }

    return validatedObject;

}

// Function to load and assign global variables to API Store data
function loadData(storedData) {

    if (storedData !== false) {

        // Check the data is what it should be
        let validatedObject = validateSaveDataObject(storedData);

        // Assign storeData from SE API Store to 
        countdownEndTime = validatedObject.countdownEndTime;
        storedTimeToAdd = validatedObject.storedTimeToAdd;
        subathonHasStarted = validatedObject.subathonHasStarted;
        timerIsRunning = validatedObject.timerIsRunning;

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
    // Timer Variables
    timePerTier1Sub = fieldData.timePerTier1Sub;
    timePerTier2Sub = fieldData.timePerTier2Sub;
    timePerTier3Sub = fieldData.timePerTier3Sub;
    timePerTip = fieldData.timePerTip;
    timePerCheer = fieldData.timePerCheer;
    timePerFollow = fieldData.timePerFollow;
    timePerRaider = fieldData.timePerRaider;

    // Widget Variables
    subathonStartDuration = fieldData.subathonStartDuration;
    happyHourDuration = (fieldData.happyHourDuration * 1000);
    subathonCapped = fieldData.subathonCapped === 'true' ? true : false;
    subathonCapEndDate = fieldData.subathonCapEndDate;
    subathonCapEndTime = fieldData.subathonCapEndTime;
    timezoneOffset = fieldData.timezoneOffset;
    playSFX = fieldData.playSFX === 'true' ? true : false;
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

//// UTILITY FUNCITONS ////

// FUNCTION TO SANITISE TEXT INPUTS
function html_encode(e) {

    return e.replace(/[\<\>\"\^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });

}

// FUNCTION TO GENERATE RANDOM NUMBERS
function randomNumber(min, max) {

    // RETURN AN INTEGER BETWEEN 0 AND 100
    let number = Math.floor(Math.random() * (max - min + 1) + min);
    return number;

}

// FUNCTION TO CONVERT SECONDS TO TIME
function convertSecondsToTime(timeInSeconds) {

    // Calculate time components
    let days = 0, hours = 0, minutes = 0, seconds = 0;
    days = Math.floor(timeInSeconds / (1000 * 60 * 60 * 24));
    hours = Math.floor((timeInSeconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((timeInSeconds % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((timeInSeconds % (1000 * 60)) / 1000);

    // Add a 0 if only a single digit
    if (seconds < 10) { seconds = '0' + seconds; }
    if (minutes < 10) { minutes = '0' + minutes; }
    if (hours < 10) { hours = '0' + hours; }
    if (days < 10) { days = '0' + days; }

    // Return Values
    let returnObj = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    }
    return returnObj;

}