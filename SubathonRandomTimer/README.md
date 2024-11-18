# Random Subathon Countdown Timer - StreamElements Custom Widget

A countdown timer for Twitch sub-a-thons, with the time added for Tier 1 Subs affected by a random multiplier

The multiplier odds are: x1 (45%), x2 (25%), x3 (15%), x5 (5%), x0.5 (10%)

Features:
- Can add time for follows, subs, cheers, tips, raids 
- Customisable time amounts to add
- Ability to cap subathon duration
- Happy Hour that doubles time added
- Pop up animation of time adding stream events
- Customisable widget text and fonts
- Chat commands to start and pause timer
- Chat commands to add and remove time
- Chat command to output all subathon information
- Saves values to API Store in case stream goes offline

Chat Commands:
- !subathonstart : Begins or resumes the suabthon
- !subathonpause : Pauses the subathon while still allowing time to add
- !subathonadd & !subathonremove : Manually adds and removes time while subathon is running
- !subathonreset : Resets the suabthon to the starting duration
- !subathon : Replies with a chat message of time amounts and cap
- !happyhour : Toggles happy hour that doubles time added (also doubles random amount)

To have the StreamElement Chatbot Reply to chat messages, the JWT Token needs to be provided as Field Data under the secret key to access the API
It is obtained from https://streamelements.com/dashboard/account/channels

![Subathon Random Countdown Timer Widget Preview](/SubathonRandomTimer/preview.png?)
