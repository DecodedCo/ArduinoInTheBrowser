# Playduino

## Arduino in the browser
* Thanks to Mr Jones, who started me off: https://github.com/mrjones/Chrome-Arduino
*
* This project got closed down at Decoded and so I no longer maintain it at work, however I think its cool so Im more than happy to continue looking after it. With community help ;)
* Im alex at Decoded dot com if anyone wants me....
## Installation instructions

### From source:
Playduino is built with Node and Grunt. Grunt is a node manager so will need to be installed with npm

* You must have an up-to-date version of Node. See these instructions if you have an older version of Node installed and need to upgrade: http://davidwalsh.name/upgrade-nodejs
* Clone the Playduino repo on your local machine
* Edit `extension/src/serialmonitor.js`
	* the line `var urlAddress = "playduino.server.com"` needs to point at your server
	* See server repository for details on configuring that
	* Note the above URL doesnt exist, you will need to configure your own server
* `cd` into playduino/extension directory
* Run `sudo npm install`
* Then run `sudo npm install -g grunt-cli` 
* Run `grunt`

You should get a message that says "Done, without errors". Now you can install in Chrome. 

* Install into Chrome by going to extensions (under settings), make sure 'Developer Mode' is ticked
* You can then click the "Load Unpacked extension" and choose the folder with 'manifest.json' in.
* The plugin will then be loaded and you can run it from the Apps button in Chrome.

## Behind the scenes

* The plugin connects back to playduino.server.com to compile the code. This url does not exist and you will need to point this at your server
* The server side to this is at https://github.com/DecodedCo/ArduinoInTheBrowserServer
