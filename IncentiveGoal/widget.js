// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// VARIABLES FOR STREAMELEMENTS API
const SE_DATA_STORE_OBJECT_NAME = 'goalValuesObj'; // Name of Object Store Variable
const forceClearAPI = false; // Change to true to delete the SE API Store data

// FIELD DATA VARIABLES
let secretKey, goalText, showPercent;

// WIDGET VARIABLES
let goalCurrent = 0, goalTotal = 0, currentWidth = 0, goalType = 'follower';
let loadedFollowers = false;

// CHAT COMMANDS
let chatCommandSymbol = '!';
let addGoalCMD = chatCommandSymbol + 'addgoal', removeGoalCMD = chatCommandSymbol + 'removegoal',setGoalCMD = chatCommandSymbol + 'setgoal', resetGoalCMD = chatCommandSymbol + 'resetgoal';

// HTML ELEMENTS
const elementGoalBar = document.getElementById('goalBarProgress');
const elementGoalBarText = document.getElementById('goalBarText');


// Function To Make Changes To The Widget
function updateWidget() {

    if (!loadedFollowers && goalType === "totalFollower"){
        loadedFollowers = true;
        goalCurrent = data["follower-total"]["count"];
    }

    // UPDATE GOAL BAR
    let currencySymbol = userCurrency.symbol;
    let parsedGoal = +(parseFloat(goalCurrent).toFixed(2));
    let percentageFraction = +(parseFloat(goalCurrent / goalTotal).toFixed(2));
    let percentageWithDecimal = +((percentageFraction * 100).toFixed(1));
    let percentage = Math.floor(percentageFraction * 100);
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    let width = currentWidth;
 
    var intervalId = setInterval(frame, 10);

    function frame() {

        if (width === percentage) {

            currentWidth = width;
            clearInterval(intervalId);

        } else if (width < percentage) {

            width++;
            currentWidth = width;
            elementGoalBar.style.width = width + "%";

        } else if (width > percentage) {

            width--;
            currentWidth = width;
            elementGoalBar.style.width = width + "%";

        }

    }

    // Display Goal Progress Text
    let goalProgressText = ''
    if (goalType === 'tip') {
        goalProgressText += userCurrency.symbol + parsedGoal.toFixed(2) + ' / ' + currencySymbol + goalTotal.toFixed(2);
    } else {
        goalProgressText += parsedGoal.toFixed(0) + ' / ' + goalTotal;
    }
    if (showPercent === "True") goalProgressText += ' (' + percentageWithDecimal + '%)';
    elementGoalBarText.innerHTML = goalProgressText;

    // Save changes to SE API Store
    let dataToSave = {
        goalCurrent: parsedGoal
    };
    saveData(dataToSave);

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

    let shouldUpdateWidget = false;
    let currencySymbol = userCurrency.symbol;

    // Handle message only if broadcater or moderator
    if (messageData.mod || messageData.broadcaster) {

        let messageSplit = messageData.message.split(" ");

        if (messageSplit[0] == addGoalCMD) {

            if (!isNaN(parseInt(messageSplit[1]))) {

                let parsedAmountToAdd = +(parseFloat(messageSplit[1]).toFixed(2));

                if (!isNaN(parsedAmountToAdd) && parsedAmountToAdd > 0) {

                    goalCurrent += parsedAmountToAdd;
                    shouldUpdateWidget = true;
                    sendBotChatMessage("DonationGoal: Added " + currencySymbol + parsedAmountToAdd.toFixed(2) + " To Goal. New Total " + currencySymbol + goalCurrent.toFixed(2));
                }

            }

        } else if (messageSplit[0] == removeGoalCMD) {

            if (!isNaN(parseInt(messageSplit[1]))) {

                let parsedAmountToAdd = +(parseFloat(messageSplit[1]).toFixed(2));

                if (!isNaN(parsedAmountToAdd) && parsedAmountToAdd > 0) {

                    goalCurrent += -parsedAmountToAdd;
                    shouldUpdateWidget = true;
                    sendBotChatMessage("DonationGoal: Added " + currencySymbol + parsedAmountToAdd.toFixed(2) + " To Goal. New Total " + currencySymbol + goalCurrent.toFixed(2));
                
                }

            }

        } else if (messageSplit[0] == setGoalCMD) {

            if (!isNaN(parseInt(messageSplit[1]))) {

                let parsedSetAmount = +(parseFloat(messageSplit[1]).toFixed(2));

                if (!isNaN(parsedSetAmount) && parsedSetAmount >= 0) {

                    goalCurrent = parsedSetAmount;
                    shouldUpdateWidget = true;
                    sendBotChatMessage("DonationGoal: Set Goal Total to " + currencySymbol + goalCurrent.toFixed(2));

                }
            }

        } else if (messageSplit[0] == resetGoalCMD) {
            
            goalCurrent = 0;
            shouldUpdateWidget = true;
            sendBotChatMessage("DonationGoal: Reset Goal Total to " + currencySymbol + goalCurrent.toFixed(2));
 
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

    // Assign common variables
    let username = '', displayname = '', amount = '', message = '';
    if (event.name !== undefined) username = event.name;
    if (event.displayName !== undefined) displayname = event.displayName;
    if (event.amount !== undefined) amount = event.amount;
    if (event.message !== undefined) message = html_encode(event.message);

    // NEW FOLLOWER
    if (listener === 'follower' && (goalType === 'follower' || goalType === "totalFollower")) {
        
        goalCurrent += 1;
        shouldUpdateWidget = true;

    // NEW SUBSCRIBER
    } else if (listener === 'subscriber' && goalType === 'subscriber') {

        if (event.bulkGifted) return;

        goalCurrent += 1;
        shouldUpdateWidget = true;

    // NEW TIP
    } else if (listener === 'tip' && goalType === 'tip') {

        if (!isNaN(parseInt(event.amount))) {

            let parsedAmountToAdd = +(parseFloat(event.amount).toFixed(2));

            if (!isNaN(parsedAmountToAdd) && parsedAmountToAdd > 0) {

                goalCurrent += parsedAmountToAdd;
                shouldUpdateWidget = true;

            }
        }

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
        goalCurrent: 0
    };

    // Create a new object identical to the default object
    let validatedObject = structuredClone(defaultSaveObject);

    // Check each value is valid, assign data if they are
    if (!isNaN(parseFloat(objectToValidate.goalCurrent))) {

        let parsedGoalCurrentForSave = +(parseFloat(objectToValidate.goalCurrent).toFixed(2));
        validatedObject.goalCurrent = parsedGoalCurrentForSave;

    }

    return validatedObject;

}

// Function to load and assign global variables to API Store data
function loadData(storedData) {

    if (storedData !== false) {

        // Check the data is what it should be
        let validatedObject = validateSaveDataObject(storedData);

        // Assign storeData from SE API Store to 
        goalCurrent = validatedObject.goalCurrent; 

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
    goalTotal = fieldData.goalTotal;
    goalText = fieldData.goalText;
    showPercent = fieldData.showPercent;
    currencySymbol = fieldData.currencySymbol;
    goalType = fieldData.goalType;

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
        saveData = {};
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