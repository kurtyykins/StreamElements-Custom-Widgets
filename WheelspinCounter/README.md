# Wheelspin Counter - StreamElements Custom Widget

A Twitch overlay that counts Subscribers, Tips and Cheers which progress towards a wheelspin counter

Features:
- Customisable widget text and fonts
- Changeable thresholds for adding to the counter
- Chat commands to add and reset counter values
- Wheelspin animation
- Saves counter values to API Store for between streams
- Punishment wheelspins if broadcaster sends specified chat messages
- Change text and animation alignment

Chat Commands:
- !addsub & !addwheelspin : Adds to the counters (defaults to 1 unlss specified i.e. "!addsubs 2")
- !removesub & !removewheelspin : Removes from the counters (defaults to 1 unless specified i.e. "!removesubs 3")
- !setsubs & !setwheelspins : Sets the counter values to specified value (i.e. "!setsubs 4")
- !resetsubs & !resetwheelspins : Sets the counter values to zero
- !enablemessagewheelspins & !disablemessagewheelspins : Toggles adding wheelspins if broadcaster types certain messages in chat

Events that happen when the stream is offline will still be counted if the widget is open in OBS or the overlay editor

To have the StreamElement Chatbot Reply to chat messages, the JWT Token needs to be provided as Field Data under the secret key to access the API
It is obtained from https://streamelements.com/dashboard/account/channels

![Wheelspin Widget Preview](/WheelspinCounter/preview.png?)
