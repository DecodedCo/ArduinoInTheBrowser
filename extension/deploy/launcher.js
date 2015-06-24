chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('serialmonitor.html', {
    'width': 1366,
    'height': 700
  });
});
