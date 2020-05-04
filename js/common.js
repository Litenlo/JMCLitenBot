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

        try {
            eval(jsFile.ReadAll());
        } catch (e) {
            for (var v in e) {
                log(gurmStringify(e));
            }
        }

		log("file " + fileName + " included");
	} else {
		log("file " + fileName + " doesn't exist");
	}
}

function jsonStringify(arr) {
    var parts = [];
    var is_list = (Object.prototype.toString.apply(arr) === '[object Array]');
    for(var key in arr) {
        var value = arr[key];
        if(typeof value == "object") { //Custom handling for arrays
            if(is_list) parts.push(jsonStringify(value)); /* :RECURSION: */
            else parts.push("'" + key + "':" + jsonStringify(value)); /* :RECURSION: */
            //else parts[key] = array2json(value); /* :RECURSION: */

        } else {
            var str = "";
            if(!is_list) str = "'" + key + "':";

            //Custom handling for multiple data types
            if(typeof value == "number") str += value; //Numbers
            else if(value === false) str += 'false'; //The booleans
            else if(value === true) str += 'true';
            else str += "'" + value.replace("'", "\'") + "'"; //All other things

            parts.push(str);
        }
    }
    var json = parts.join(",\n");

    if(is_list) return '[\n' + json + '\n]';//Return numerical JSON
    return '{\n' + json + '\n}';//Return associative JSON
}

function jsonParse(_json) {
    log(_json);
    return eval("(" + _json + ")");
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
    //file.WriteLine(jsonStringify(_obj));
    file.WriteLine(gurmStringify(_obj));
	file.Close();
}

// function readObjectFromFile(_filename) {
//     var result = "";
//     if (fileSystem.FileExists(_filename)) {
//         var	file = fileSystem.OpenTextFile(_filename, FD_READ);
//
//         while (file.AtEndOfStream === false) {
//             var str = file.ReadLine();
//             result = result + str;
//         }
//         file.Close();
//     }
//     return result.length > 0 ? jsonParse(result, 0) : [];
// }

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

function findInArray(_arr, _str) {
    for (var i = 0; i < _arr.length; i++) {
        if (_arr[i] === _str) {
            return i;
        }
    }
    return -1;
}

String.prototype.hash = function() {
    var s = this;
    var i, l, hval = 0x811c9dc5;

    for (i = 0, l = s.length; i < l; i++) {
        hval ^= s.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return ((hval >>> 0).toString(16)).substr(-8);
}

String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
};

include("js/main.js");
