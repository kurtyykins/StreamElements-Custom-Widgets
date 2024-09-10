# Incentive Goal - StreamElements Custom Widget

A Twitch overlay that adds a follower, subscriber or tip incentive goal

Features:
- Follower, Subscriber or Tip modes
- Customisable widget text, fonts and colours
- Percent complete toggle
- Changeable goal amount
- Chat commands to add and set current total
- Saves current total values to API Store

Chat Commands:
- !addgoal : Adds to the goal total (defaults to 1 unlss specified i.e. "!addgoal 2")
- !removegoal : Removes from the goal total (defaults to 1 unless specified i.e. "!removegoal 3")
- !setgoal : Sets the goal total to specified value (i.e. "!setgoal 4")
- !resetgoal : Sets the goal total values to zero

Events that happen when the stream is offline will still be counted if the widget is open in OBS or the overlay editor

To have the StreamElement Chatbot Reply to chat messages, the JWT Token needs to be provided as Field Data under the secret key to access the API It is obtained from https://streamelements.com/dashboard/account/channels

![Donation Goal Widget Preview](/DonationGoal/preview.png?)
