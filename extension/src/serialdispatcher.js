var logging = require("./logging.js");

var log = logging.log;
var kDebugError = logging.kDebugError;
var kDebugNormal = logging.kDebugNormal;
var kDebugFine = logging.kDebugFine;
var kDebugVeryFine = logging.kDebugVeryFine;

function SerialDispatcher() {
  this.listeners_ = [];
};

SerialDispatcher.prototype.listeners_ = [];

SerialDispatcher.prototype.dispatch = function(readArg) {
//  log(kDebugFine, "SerialDispatcher::Dispatch to " + this.listeners_.length);
  for (var i = 0; i < this.listeners_.length; ++i) {
    // TODO(mrjones): It seems like we should compare
    // readArg.connectionId with listener.id here?
    this.listeners_[i].listener(readArg);
  }
}

SerialDispatcher.prototype.addListener = function(id, listener) {
  log(kDebugFine, "SerialDispatcher::AddListener " + id);
  for (var i = 0; i < this.listeners_.length; ++i) {
    if (this.listeners_[i].id == id) {
      log(kDebugError, "Already has a listener with id '" + id + "'");
      return;
    }
  }
  this.listeners_.push({id: id, listener: listener});
}

SerialDispatcher.prototype.removeListener = function(id) {
  for (var i = 0; i < this.listeners_.length; ++i) {
    if (this.listeners_[i].id == id) {
      this.listeners_.splice(i, 1);
    }
  }
}

exports.SerialDispatcher = SerialDispatcher;
