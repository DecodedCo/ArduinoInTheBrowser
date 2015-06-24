var SerialDispatcher = require("./serialdispatcher.js").SerialDispatcher;
var ParseHexFile = require("./hexparser.js").ParseHexFile;
var logging = require("./logging.js");
var stk500 = require("./stk500.js");
var binary = require("./binary.js");

var hexToBin = binary.hexToBin;
var binToHex = binary.binToHex;
var log = logging.log;
var kDebugError = logging.kDebugError;
var kDebugNormal = logging.kDebugNormal;
var kDebugFine = logging.kDebugFine;
var kDebugVeryFine = logging.kDebugVeryFine;

var databuffer = { };

var globalDispatcher = new SerialDispatcher();
if (typeof(chrome) != "undefined" &&
    typeof(chrome.serial) != "undefined") {

  log(kDebugNormal, "Initting global dispatcher");
  chrome.serial.onReceive.addListener(
    globalDispatcher.dispatch.bind(globalDispatcher));

  chrome.serial.onReceiveError.addListener(
    function(errorInfo) {
      console.log("ERROR: " + JSON.stringify(errorInfo));
    });

  chrome.serial.onReceive.addListener(
    function(errorInfo) {
      if(errorInfo.data.length > 0){
       console.log("READ: " + JSON.stringify(errorInfo));
      }
    });
}

function readToBuffer(readArg) {
  log(kDebugFine, "READ TO BUFFER:" + JSON.stringify(readArg));
  if (typeof(databuffer[readArg.connectionId]) == "undefined") {
    log(kDebugFine, "Constructed buffer for: " + readArg.connectionId);
    databuffer[readArg.connectionId] = [];
  }

  var hexData = binToHex(readArg.data);

  log(kDebugFine, "Pushing " + hexData.length + " bytes onto buffer for: " + readArg.connectionId + " " + hexData);
  for (var i = 0; i < hexData.length; ++i) {
    databuffer[readArg.connectionId].push(hexData[i]);
  }
  log(kDebugFine, "Buffer for " + readArg.connectionId + " now of size " + databuffer[readArg.connectionId].length);
}

function readFromBuffer(connectionId, maxBytes, callback) {
  if (typeof(databuffer[connectionId]) == "undefined") {
    log(kDebugFine, "No buffer for: " + connectionId);
    callback({bytesRead: 0, data: []});
    return;
  }

  var bytes = Math.min(maxBytes, databuffer[connectionId].length);
  log(kDebugFine, "Reading " + bytes + " from buffer for " + connectionId);

  var accum = [];
  for (var i = 0; i < bytes; ++i) {
    accum.push(databuffer[connectionId].shift());
  }

  log(kDebugFine, "readFromBuffer -> " + binToHex(accum));

  callback({bytesRead: bytes, data: accum});
}

// TODO: board and prototocol should be separate variables
function uploadSketch(deviceName, protocol, sketchUrl) {
  log(kDebugNormal, "Uploading blink sketch from: " + sketchUrl);

    chrome.storage.local.get('identity', function(result){
        console.log(result)
        var identityUrl = sketchUrl + "?identity="+result.identity;
        fetchProgram(identityUrl, function(programBytes) {
          log(kDebugFine, "Fetched program. Uploading to: " + deviceName);
          log(kDebugFine, "Protocol: " + protocol);
          uploadCompiledSketch(programBytes, deviceName, protocol);
        });
    });


}

function fetchProgram(url, handler) {
  log(kDebugFine, "Fetching: " + url)
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        var programBytes = ParseHexFile(xhr.responseText);
        log(kDebugFine, "Fetched Data:\n" + xhr.responseText);

        handler(programBytes);
      } else {
        log(kDebugError, "Bad fetch: " + xhr.status);
      }
    }
  };
  xhr.open("GET", url, true);
  xhr.send();
}

function pad(data, pageSize) {
  while (data.length % pageSize != 0) {
    data.push(0);
  }
  return data;
}

function uploadCompiledSketch(hexData, deviceName, protocol) {
  if (protocol == "stk500") {
    var boardObj = stk500.NewStk500Board(chrome.serial, 128);
    if (!boardObj.status.ok()) {
      log(kDebugError, "Couldn't create STK500 Board: " + boardObj.status.toString());
      return;
    }
    var board = boardObj.board;

    board.connect(deviceName, function(status) {
      if (status.ok()) {
        log(kDebugNormal, "STK500: connected.");
        board.writeFlash(0, pad(hexData, 128), function(status) {
          log(kDebugNormal, "<span style='color:blue'>STK programming status: " + status.toString() + "</span>");
        });
      } else {
        log(kDebugNormal, "STK: connection error: " + status.toString());
      }
    });
  } else if (protocol == "avr109") {
    var boardObj = avr109.NewAvr109Board(chrome.serial, 128, globalDispatcher);
    if (!boardObj.status.ok()) {
      log(kDebugError, "Couldn't create AVR109 Board: " + boardObj.status.toString());
      return;
    }
    var board = boardObj.board;
    board.connect(deviceName, function(status) {
      if (status.ok()) {
        log(kDebugNormal, "AVR109 Connected. Writing flash!");
        board.writeFlash(0, pad(hexData, 128), function(status) {
          log(kDebugNormal, "AVR programming status: " + status.toString());
        });
      } else {
        log(kDebugNormal, "AVR connection error: " + status.toString());
      }
    });
  } else {
    log(kDebugError, "Unknown protocol: "  + protocol);
  }
}


exports.pad = pad;
exports.uploadSketch = uploadSketch;
