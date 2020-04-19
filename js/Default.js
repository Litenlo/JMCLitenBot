var fileSystem = new ActiveXObject("Scripting.FileSystemObject");
var FD_READ = 1;
var FD_WRITE = 2;
var FD_APPEND = 8;

function writeArrayToFile(_filename, _arr) {
   	var	file = fileSystem.FileExists(_filename) ? fileSystem.OpenTextFile(_filename,FD_WRITE) : fileSystem.CreateTextFile(_filename,true);

    for (var i = 0; i < _arr.length; i++) {
    	file.WriteLine(_arr[i]);
    }
	file.Close();
}

function readArrayFromFile(_filename) {
    var result = [];
    if (fileSystem.FileExists(_filename)) {
       	var	file = fileSystem.OpenTextFile(_filename, FD_READ);

		while (file.AtEndOfStream === false) {
			var str = file.ReadLine();
			result.push(str);
		}
		file.Close();
    }

	return result;
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


var regexpResult = "";
function regexp(_rx, _str) {
    regexpResult = _rx.exec(_str);
    return regexpResult;
}

var timers = function () {

    var timers = {};

    this.create = function(_id, _msec, _fnc) {
        timers[_id] = _fnc;
        jmc.SetTimer(_id, _msec);
    };

    this.kill = function(_id) {
        jmc.KillTimer(_id);
    }

    this.onTimer = function() {
        var timerId = jmc.Event;
        if (timers[timerId] !== undefined ) {

            if (typeof timers[timerId] === "string") {
                jmc.parse(timers[timerId]);
            } else {
                timers[timerId]();
            }
        }
    }

    return this;
}

var litenBot = function () {

    var self = this;

    this.badWordCounter = 0;
    var badWordCounterTimeout = 100;
    var badWordCounterMax = 15;
    var prayInfo = false;
    var prayShowGoodLine = false;
    var prayShowBadLine = true;
    var prayNormalWordReg;
    var prayNormalWordMinLength = 0;
    var prayNormalWordFile = "data/goodwordvoc.dat";
    var prayNormalWords = readArrayFromFile(prayNormalWordFile);

    genNormalWordReg();

    this.timers = new timers();

    self.onBadWordCounter = function() {
        //jmc.showme(color("41;1") + "Litenbot: counter reset");
        self.badWordCounter = 0;
    }

    function genNormalWordReg() {
        prayNormalWordReg = "стоит";
        for (var i = 0; i < prayNormalWords.length; i++) {
            var curword = prayNormalWords[i];
            if (curword.length > prayNormalWordMinLength) {
                prayNormalWordReg = prayNormalWordReg + "|" + curword;
            }
        }
    }

    this.addPrayCorrectWord = function (_str) {
        prayNormalWords.push(_str);

        jmc.showme(color(37) + "Litenbot: pray info regenerated");

        genNormalWordReg();

        jmc.showme(color(37) + "Litenbot: prayreg now - " + prayNormalWords.length);

        writeArrayToFile(prayNormalWordFile, prayNormalWords);
    }

    this.parseInput = function(_text) {
        if (_text === "bot.help") {
            jmc.showme(color(36) + "LitenBot help");
            return null;
        }
        if (regexp(/bot.pray.add (.*)/, _text)) {
            this.addPrayCorrectWord(regexpResult[1]);
            return null;
        }
        if (_text === "bot.pray.info.show") {
            jmc.showme(color(37) + "Litenbot: pray info on");
            this.timers.create(101, badWordCounterTimeout, self.onBadWordCounter);
            prayInfo = true;
            return null;
        }
        if (_text === "bot.pray.info.hide") {
            jmc.showme(color(37) + "Litenbot: pray info off");
            this.timers.kill(101);
            prayInfo = false;
            return null;
        }
        return _text;
    }

    this.onInput = function() {
        jmc.event = this.parseInput(jmc.event);
    }
// нужны уникальные слова
// возможно надо брать первое слово
// возможно надо обрезать гласные в конце
// возможно надо считать сколько уникальных вхождений
// /ало |выдао /.exec ищет вхождение
    this.parseIncoming = function(_text) {
        if (prayInfo) {
            _cleartext = removeColor(_text);

            var regWord = new RegExp(prayNormalWordReg, "i");
            if (_cleartext === "" || regWord.exec(_cleartext) != null) {
                if (prayShowGoodLine) {
                    _text = _text + color("32;1") + "[+] "  + color("0");
                }
            }
            else
            {
                if (prayShowBadLine) {
                    _text = _text + color("31;1") + "[-] " + color("0");
                }
                this.badWordCounter++;
                jmc.showme(color("31") + "Litenbot: unknown string: " + this.badWordCounter);
                if (this.badWordCounter === badWordCounterMax) {
                    jmc.showme(color("41;1") + "Litenbot: unknown string counter MAX!");
                    jmc.play("sounds/chbell.wav");
                }
            }

        }

        return _text;
    }

    this.onIncoming = function() {
        jmc.event = this.parseIncoming(jmc.event);
    }
    return this;
}

var bot = new litenBot();

// register timer event
jmc.RegisterHandler("Timer", "bot.timers.onTimer()");

// register user / jmc input event
jmc.RegisterHandler("Input", "bot.onInput()");

// register income text event
jmc.RegisterHandler("Incoming", "bot.onIncoming()");