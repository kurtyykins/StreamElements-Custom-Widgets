// DATA ASSIGNED WHEN THE WIDGET LOADS
let channel, channelID, data, apiToken, fieldData, userCurrency;

// FIELD DATA VARIABLES
let secretKey;

// WIDGET VARIABLES
let currentShown = 0, latestFollower, totalFollowers, latestSubscriber, totalSubscribers, latestTipper, latestCheerer, latestRaider;
let latestArray = [];

// WIDGET SETTINGS
let displayDuration = 10, includeFollows, includeTotalFollows, includeSubscribers, includeTotalSubscribers, includeTippers, includeCheerer, includeRaiders;

// HTML ELEMENTS
const elementLatestText = document.getElementById('latestText');



// Function To Make Changes To The Widget
function updateWidget() {

    latestArray = [
        'Latest Follower: ' + latestFollower,
        'Total Followers: ' + totalFollowers,
        'Latest Subscriber: ' + latestSubscriber,
        'Total Subscribers: ' + totalSubscribers,
        'Latest Tipper: ' + latestTipper,
        'Latest Cheerer: ' + latestCheerer,
        'Latest Raider: ' + latestRaider
    ]

}

function displayLabel() {

    // Skip if not included in field data
    if (currentShown === 0 && includeFollows === "False") currentShown++;
    if (currentShown === 1 && includeTotalFollows === "False") currentShown++;
    if (currentShown === 2 && includeSubscribers === "False") currentShown++;
    if (currentShown === 3 && includeTotalSubscribers === "False") currentShown++;
    if (currentShown === 4 && includeTippers === "False") currentShown++;
    if (currentShown === 5 && includeCheerer === "False") currentShown++;
    if (currentShown === 6 && includeRaiders === "False") currentShown++;

    if (currentShown >= latestArray.length) currentShown = 0;

    elementLatestText.innerHTML = latestArray[currentShown];

    currentShown++;
    if (currentShown >= latestArray.length) currentShown = 0;

}


// Function called each stream event
function handleStreamEvent(listener, event) {

    let shouldUpdateWidget = false;

    // Assign common variables
    let username = '', displayname = '', amount = '';
    if (event.name !== undefined) username = event.name;
    if (event.displayName !== undefined) displayname = event.displayName;
    if (event.amount !== undefined) amount = event.amount;

    // NEW FOLLOWER
    if (listener === 'follower') {

        // Username is the new follower
        latestFollower = displayname;
        totalFollowers += 1;
        shouldUpdateWidget = true;

    // NEW SUBSCRIBER
    } else if (listener === 'subscriber') {

        // The event when it says 'X gifted Y subs'
        if (event.bulkGifted) return;

        totalSubscribers += 1;

        // Normal Subscriber
        if (!event.gifted) {

            latestSubscriber = displayname;

        // Gifted Subscription Subscriber
        } else {

            let gifterUsername = ''; // Who gifted the subscription
            if (event.sender !== undefined) gifterUsername = event.sender;
            latestSubscriber = gifterUsername;

        }

        shouldUpdateWidget = true;

    // NEW CHEER
    } else if (listener === 'cheer') {

        latestCheerer = displayname;
        shouldUpdateWidget = true;

    // NEW TIP
    } else if (listener === 'tip') {

        latestTipper = displayname;
        shouldUpdateWidget = true;

    // NEW RAID
    } else if (listener === 'raid') {

        latestRaider = displayname;
        shouldUpdateWidget = true;

    }

    // Update widget if something changed
    if (shouldUpdateWidget) {
        updateWidget();
    }

}

// Function to assign widget field data to global variables
function setFieldDataVariables() {

    // Assign global variables to field data for ease of use
    displayDuration = fieldData.displayDuration;
    includeFollows = fieldData.includeFollows;
    includeTotalFollows = fieldData.includeTotalFollows;
    includeSubscribers = fieldData.includeSubscribers;
    includeTotalSubscribers = fieldData.includeTotalSubscribers;
    includeTippers = fieldData.includeTippers;
    includeCheerer = fieldData.includeCheerer;
    includeRaiders = fieldData.includeRaiders;
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

    // Update Widget
    updateWidget();

    // Constantly Update Widget
    displayLabel();
    setInterval(displayLabel, (displayDuration * 1000));

});


// THIS FUNCTION IS CALLED EVERY STREAM EVENT
window.addEventListener('onEventReceived', function (obj) {

    // Return if there was no event
    if (!obj.detail.event) return;

    // Get information on the event
    const event = obj.detail.event;
    const listener = obj.detail.listener.split("-")[0];

    // Make changes based on the event
    handleStreamEvent(listener, event);

});