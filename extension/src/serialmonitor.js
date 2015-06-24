var uploader = require("./uploader.js");
var logging = require("./logging.js");
// var ipAddress = '172.16.0.66'
var ipAddress = "playduino.server.com"

var log = logging.log;
var kDebugError = logging.kDebugError;
var kDebugNormal = logging.kDebugNormal;
var kDebugFine = logging.kDebugFine;

var kBitrate = 9600;
var kUnconnected = -1;

var readListener; //read event listener

var connectionId_ = kUnconnected;

var ids = {
  connectButton: "connect",
  disconnectButton: "disconnect",
  refreshDevicesButton: "devices_refresh",
  refreshDevicesMenu: "devices_menu",
  sendText: "todevice_data",
  sendButton: "todevice_send",
  statusText: "status",
  uploaderButton: "uploader_button",
  compileButton: "compile_button",
  logLevelMenu: "log_level_picker",
  serialInput: "serial-input"
};

logging.configureVisibleLogging(ids.statusText);

log(kDebugFine, "-- BEGIN --");
document.getElementById("todevice_send")
  .addEventListener('click', sendDataToDevice);

document.getElementById(ids.refreshDevicesButton)
  .addEventListener('click', detectDevices);

  document.getElementById(ids.refreshDevicesButton)
    .addEventListener('click', clearPanels);

document.getElementById(ids.connectButton)
  .addEventListener('click', connectToSelectedSerialPort);

document.getElementById(ids.disconnectButton)
  .addEventListener('click', disconnect);

document.getElementById(ids.sendText)
  .addEventListener('keydown', doOnEnter(sendDataToDevice));

document.getElementById(ids.uploaderButton)
  .addEventListener('click', beginUpload);

document.getElementById(ids.compileButton)
  .addEventListener('click', beginCompilation);

document.getElementById(ids.logLevelMenu)
  .addEventListener('change', logLevelChanged);

document.getElementById(ids.disconnectButton).style.display = "none";
document.getElementById(ids.serialInput).style.display = "none";
//document.getElementById(ids.sendButton).disabled = true;

function loadingAnimation(state) {
  if (state == true) {
    $('#main-loader').show();
  } else {
    $('#main-loader').hide();
  }
}

function beginCompilation(){
  loadingAnimation(true);
  var program = document.getElementById("text-editor").value;
  document.getElementById("status").innerHTML = "";
  console.log("program: " + program);
  $.post( "http://"+ipAddress+"/App/program", { "program": program } )
   .done(function( data ) {
    loadingAnimation(false);
    // log(kDebugFine, data.message );
    if (data.message.indexOf("compilation successful") > -1) {//Filename may change here!!
      log(kDebugFine, data.message );
      log(kDebugNormal, data.message);
      //get the identity of the build and store it somewhere? localstorage?
      log(kDebugFine, data.identity );
      log(kDebugNormal, "user: " + data.identity);
      chrome.storage.local.set({"identity":data.identity});
    } else {
      log(kDebugFine, "There was a problem, please check your code" );
      log(kDebugFine, data.result );
      log(kDebugNormal, "<pre>"+data.result.replace("\n", "<br/>")+"</pre>");
    }

  });
}

function logLevelChanged() {
  var logLevelMenu = document.getElementById(ids.logLevelMenu);
  var logLevel = logLevelMenu.options[logLevelMenu.selectedIndex].value;

  logging.setVisibleLogLevel(logLevel);
  console.log(window.location);
}

function beginUpload() {
  disconnect(); //disconnect from serial
  document.getElementById("status").innerHTML = "";
  var portMenu = document.getElementById("devices_menu");
  var selectedPort = portMenu.options[portMenu.selectedIndex].text;

  var protocolMenu = document.getElementById("protocol");
  var protocol = "stk500"; //forcing stk500 protocol
  hexLocation = "http://"+ipAddress+"/hex";

  uploader.uploadSketch(selectedPort, protocol, hexLocation);
}

function doOnEnter(targetFunction) {
  return function(event) {
    if (event.keyCode == 13) {
      targetFunction();
    }
  }
}

function clearPanels() {

  var serialData = document.getElementById("fromdevice_data");
  serialData.innerHTML = '';
  serialData.scrollTop = serialData.scrollHeight;

  document.getElementById("status").innerHTML = "";

}

function detectDevices() {
  var foundUsb = false;
  var menu = document.getElementById("devices_menu");
  menu.options.length = 0;
  chrome.serial.getDevices(function(devices) {
    for (var i = 0; i < devices.length; ++i) {
      log(kDebugFine, devices[i].path);
      var portOpt = document.createElement("option");
      portOpt.text = devices[i].path;
      if (!foundUsb && devices[i].path.indexOf("tty.usb") > -1) {
        foundUsb = true;
        portOpt.selected = true;
      }
      menu.add(portOpt, null);
    }
  });
  return false;
}

detectDevices();

function sendDataToDevice() {
  if (connectionId_ == kUnconnected) {
    log(kDebugError, "ERROR: Not connected");
  } else {
    doSend();
  }
}

var DOMBuffer, DOMBufferInterval, ClearInterval;

function serialConnectDone(connectArg) {
  log(kDebugFine, "ON CONNECT:" + JSON.stringify(connectArg));
  if (!connectArg || connectArg.connectionId == -1) {
    log(kDebugError, "Error. Could not connect.");
    return;
  }
  connectionId_ = connectArg.connectionId;
  document.getElementById(ids.connectButton).disabled = true;
  document.getElementById(ids.refreshDevicesButton).disabled = true;
  document.getElementById(ids.refreshDevicesMenu).disabled = true;

  document.getElementById(ids.disconnectButton).disabled = false;
  document.getElementById(ids.sendButton).disabled = false;
  document.getElementById(ids.serialInput).style.display = "block";

  log(kDebugNormal, "CONNECTION ID: " + connectionId_);
  document.getElementById("fromdevice_data").innerHTML = "";
  chrome.serial.onReceive.addListener(readHandler);

  // Set timeout to rad DOM Buffer and add to DOM
  DOMBufferInterval = setInterval(writeDOMBuffer, 500);
  ClearInterval = setInterval(clearSerialData, 10000);

  }

function connectToSelectedSerialPort() {
  var portMenu = document.getElementById("devices_menu");
  var selectedPort = portMenu.options[portMenu.selectedIndex].text;
  document.getElementById(ids.connectButton).style.display = "none";
  document.getElementById(ids.disconnectButton).style.display = "inline-block";
  log(kDebugNormal, "Using port: " + selectedPort);
  chrome.serial.connect(selectedPort, {bitrate: kBitrate}, serialConnectDone);
}

function disconnectDone(disconnectArg) {
  connectionId_ = kUnconnected;
  document.getElementById(ids.connectButton).disabled = false;
  document.getElementById(ids.refreshDevicesButton).disabled = false;
  document.getElementById(ids.refreshDevicesMenu).disabled = false;

  document.getElementById(ids.connectButton).style.display = "inline-block";
  document.getElementById(ids.disconnectButton).style.display = "none";

  document.getElementById(ids.serialInput).style.display = "none";

  document.getElementById(ids.sendButton).disabled = true;
  log(kDebugFine, "disconnectArg: " + JSON.stringify(disconnectArg));

  chrome.serial.onReceive.removeListener(readHandler);

  clearInterval(DOMBufferInterval);
  clearInterval(ClearInterval);

}


function disconnect() {
  if (connectionId_ == kUnconnected) {
    log(kDebugNormal, "Can't disconnect: Already disconnected!");
    return;
  }
  chrome.serial.disconnect(connectionId_, disconnectDone);

}

function doSend() {
  var input = document.getElementById("todevice_data");
  var data = input.value;
  input.value = "";

  log(kDebugFine, "SENDING " + data + " ON CONNECTION: " + connectionId_);
  chrome.serial.send(connectionId_, stringToBinary(data), sendDone);
}

function sendDone(sendArg) {
  log(kDebugFine, "ON SEND:" + JSON.stringify(sendArg));
  log(kDebugFine, "SENT " + sendArg.bytesSent + " BYTES ON CONN: " + connectionId_);
}

function stringToBinary(str) {
  var buffer = new ArrayBuffer(str.length);
  var bufferView = new Uint8Array(buffer);
  for (var i = 0; i < str.length; i++) {
    bufferView[i] = str.charCodeAt(i);
  }

  return buffer;
}

function binaryToString(buffer) {
  var bufferView = new Uint8Array(buffer);
  var chars = [];
  for (var i = 0; i < bufferView.length; ++i) {
    chars.push(bufferView[i]);
  }

  return String.fromCharCode.apply(null, chars);
}

function connectToWebsite(u, handler) {

  var url = "http://futuretech.decoded.com/"+u;
  console.log("connecting to website: " + url);
  log(kDebugFine, "Fetching: " + url)
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        log(kDebugFine, "Fetched:\n" + xhr.responseText);

        handler();
      } else {
        log(kDebugError, "Bad fetch: " + xhr.status);
      }
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}
var url = "";
var isUrl = false;
var flushCounter = 0;
function readHandler(readArg) {
  // log(kDebugFine, "ON READ:" + JSON.stringify(readArg));
  var serialData = document.getElementById("fromdevice_data");
  // TODO: check connection id
  var str = binaryToString(readArg.data);
  console.log(str);
  // format for output
  str = str.replace("\n", "<br/>");
  // add to buffer
  DOMBuffer += str;
  // flush buffer every 100 lines received
  flushCounter++;
  if (flushCounter >= 100){
    chrome.serial.flush(connectionId_, onFlush);
    flushCounter = 0;
  }

}

var serialData = document.getElementById("fromdevice_data");
function writeDOMBuffer(){

  console.log('writing buffer');
  serialData.innerHTML += DOMBuffer;

  //check for URL and handle it
  var pipePos = DOMBuffer.indexOf('|');
  if (pipePos > -1){
    var url = DOMBuffer.substr(pipePos + 1 , DOMBuffer.length - pipePos);
    var brPos = url.indexOf('<br');
    url = url.substr(0,brPos);
    console.log(url);
    connectToWebsite(url, function(){console.log("url handled");});
  }
  // reset buffer
  DOMBuffer = '';
  // scroll down
  serialData.scrollTop = serialData.scrollHeight;
}

function clearSerialData(){
  console.log('clearing serial');
  serialData.innerHTML = '';
}

function onFlush(result){
  console.log("I flushed!", result);
}

/*
int led = 13;
void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(9600);
  Serial.println("|api/?uid=8a7827b9813f7a054484109a28905793&trigger=t8myh&value=");
}
void loop() {
  digitalWrite(led, HIGH);
  delay(100);
  digitalWrite(led, LOW);
  delay(100);
  Serial.println("hello world");
}
*/
