# StreamElements Custom Widgets

A collection of custom widget projects for StreamElements overlays for us on Twitch streams

For more information and examples, see:
- https://dev.streamelements.com/
- https://github.com/StreamElements/widgets

How To Use:

Each folder contains a different overlay widget project. If there is one you would like to use:

1. Head to https://streamelements.com/dashboard/overlays on your account.
2. Create a new overlay or choose one to add the widget(s) to.
3. Click the + to add a new widget/layer, then static/custom, then custom widget.
4. The custom widget has some code by default, we will be replacing it.
5. Click the custom widget layer and under settings click 'Open Editor'.
6. Copy and paste the code from the project folder to the corresponding tab in the Editor.
7. HTML (the layout), CSS (the styling), JS (the code) are the main ones.
8. The FIELDS tab are the widget settings which have default values.
9. For the data tab, replace all of the text with {} to have it reload data from the fields.
10. Hit save in the top right and customise the widget settings/size.
11. Copy the overlay as a browser source into OBS (ensure overlay canvas size is the same as the browser source).
