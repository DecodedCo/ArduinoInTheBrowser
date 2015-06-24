var arraysEqual = function(a1, a2) {
  if (a1.length != a2.length) {
    return false;
  }

  for (var i = 0; i < a1.length; i++) {
    if (a1[i] != a2[i]) {
      return false;
    }
  }

  return true;
}

var hasPrefix = function(candidate, prefix) {
  if (candidate.length < prefix.length) {
    return false;
  }

  for (var i = 0; i < prefix.length; i++) {
    if (prefix[i] != candidate[i]) {
      return false;
    }
  }

  return true;
}

exports.hasPrefix = hasPrefix;
exports.arraysEqual = arraysEqual;
