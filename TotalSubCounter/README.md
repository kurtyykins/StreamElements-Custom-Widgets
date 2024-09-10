# TotalSubCounter Counter - StreamElements Custom Widget

A Twitch overlay that counts Subscribers gained

Features:
- Customisable widget text and fonts
- Chat commands to add and reset counter values
- Saves counter values to API Store for between streams
- Change text displayed

Chat Commands:
- !addtotalsub : Adds to the counter (defaults to 1 unlss specified i.e. "!addtotalsub 2")
- !removetotalsub : Removes from the counter (defaults to 1 unless specified i.e. "!removetotalsub 3")
- !settotalsubs : Sets the counter value to specified value (i.e. "!settotalsubs 4")
- !resettotalsubs : Sets the counter value to zero

Events that happen when the stream is offline will still be counted if the widget is open in OBS or the overlay editor

To have the StreamElement Chatbot Reply to chat messages, the JWT Token needs to be provided as Field Data under the secret key to access the API
It is obtained from https://streamelements.com/dashboard/account/channels

![TotalSubCounter Widget Preview](/TotalSubCounter/preview.png?)
