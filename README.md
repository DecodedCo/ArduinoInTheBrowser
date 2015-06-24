# Playduino

Arduino in the browser

## Installation instructions

#### From Package:
* Just grab the .crx file and drag it into the settings/extensions page of Chrome.

### From source:
Playduino is built with Node and Grunt. Grunt is a node manager so will need to be installed with npm

* You must have an up-to-date version of Node. See these instructions if you have an older version of Node installed and need to upgrade: http://davidwalsh.name/upgrade-nodejs
* Clone the Playduino repo on your local machine
* `cd` into playduino/extension directory
* Run `sudo npm install`
* Then run `sudo npm install -g grunt-cli` 
* Run `grunt`

You should get a message that says "Done, without errors". Now you can install in Chrome. 

* Install into Chrome by going to extensions (under settings), make sure 'Developer Mode' is ticked
* You can then click the "Load Unpacked extension" and choose the folder with 'manifest.json' in.
* The plugin will then be loaded and you can run it from the Apps button in Chrome.

## Behind the scenes

* The plugin connects back to playduino.decoded.com to compile the code.
* playduino.decoded.com connects to a backend server running Docker.
* If playduino.decoded.com is down, you may need a sysadmin to reboot the server on AWS.

If you need to launch the server, please see this repository:
https://github.com/DecodedCo/playduinoserver/blob/master/RUNNING_THE_SERVER.md

you will need to update DNS in Route 53.
