var cm = require('../node_modules/codemirror/lib/codemirror');
var clike = require('../node_modules/codemirror/mode/clike/clike');
var textarea = document.getElementById('text-editor');

var options = {
  mode: 'clike',
  theme: 'solarized light',
  tabMode: 'indent',
  indentWithTabs: false,
  lineNumbers: true,
  lineWrapping: true,
  indentUnit: 2,
  tabSize: 2,
  height: 'auto'
}


var codeArea = cm.fromTextArea(textarea, options);

codeArea.on("change", function(cm, change) {
  textarea.value = codeArea.getValue()
});
