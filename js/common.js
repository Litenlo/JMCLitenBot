var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
var FD_READ = 1;
var FD_WRITE = 2;
var FD_APPEND = 8;

var regexpResult = "";
function regexp(_rx, _str) {
    regexpResult = _rx.exec(_str);
    return regexpResult;
}

function log(_text) {
    var now = new Date();

    jmc.showme(now.toLocaleTimeString("hh:mm:ss") + " [LitenBot]: " + _text);
}

function color(color, bgcolor) {

    var result = "\u001b[" + color + "m";
    if (bgcolor !== undefined) {
        result = result + "\u001b[" + bgcolor + "m";
    }
    return result;
}

function removeColor(_text) {
	return _text.replace(/\[\d?[;\d]+m/g,"");
}

function tab() {
    return "    ";
}

function include(fileName)
{
	if (fileSystem.FileExists(fileName)){
		var jsFile = fileSystem.OpenTextFile(fileName, FD_READ);
		eval(jsFile.ReadAll());
		log("file " + fileName + " included");
	} else {
		log("file " + fileName + " doesn't exist");
	}
}

var gurmDelimiter = " >>>>> ";

function gurmStringify(_obj) {
    var result = "[~" + typeof _obj + "~]\n";
    for (var name in _obj) {
        result = result + name + gurmDelimiter + (typeof _obj[name] !== "object" ? _obj[name] : gurmStringify(_obj[name])) + "\n";
    }
    result = result + "[~end~]\n"
    return result;
}

var pos = 0;
function gurmParse(_arr) {
    var result = {};
    pos++;
    while (_arr[pos] !== "[~end~]") {
        var keyval = _arr[pos].split(gurmDelimiter);
        result[keyval[0]] = keyval[1] !== "[~object~]" ? keyval[1] : gurmParse(_arr);
        pos++;
    }
    pos++;
    return result;
}

function writeObjToFile(_fileName, _obj) {
   	var	file = fileSystem.FileExists(_fileName) ? fileSystem.OpenTextFile(_fileName,FD_WRITE) : fileSystem.CreateTextFile(_fileName,true);
    file.WriteLine(gurmStringify(_obj));
	file.Close();
}

function readObjectFromFile(_filename) {
    var result = [];
    if (fileSystem.FileExists(_filename)) {
       	var	file = fileSystem.OpenTextFile(_filename, FD_READ);

		while (file.AtEndOfStream === false) {
			var str = file.ReadLine();
			result.push(str);
		}
		file.Close();
    }
    pos = 0;
	return result.length > 0 ? gurmParse(result, 0) : [];
}


include("js/main.js");
