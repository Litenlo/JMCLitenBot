 litenBotPrayBot = function(_master) {
    var self = new absModule(_master);

    self.apiname = "мол";
    self.name = "Liten bot: pray bot";
    self.version = "1.1";
    self.description = "Бот для отслеживания необычных текстовых конструкций."

    var goodWords = [];
    var godWordReg;
    var badLineCounter = 0;

    var parentConstructor = self.constructor;
    self.constructor = function() {

        self.createOption("файл_словаря", "data/word_dict_file.dat", "файл для сохранения позитивных слов / регулярных выражений / символов", "string");
        self.createOption("негатив", "да", "отмечать незнакомы строки", "string");
        self.createOption("позитив", "нет", "отмечать знакомые строки", "string");
        self.createOption("макс_плохих", "10", "максимальное количество незнакомых строк при котором выведется предупреждение", "string");
        self.createOption("время_сброса_сч", "100", "время сброса счётчика незнакомых строк", "string");
        self.createOption("счётчик", "701", "идентификатор счётчика (у тебя нет причин менять его)", "string");
        self.createOption("макс_текст", "Достигнуто максимальное значение неизвестных строк!", "текст, который будет выведен при достижении 'макс_плохих'", "string");

        parentConstructor();
        //  всегда в дефолных настройках при старте
        self.createOption("включен", "нет", "бот включен - да / нет", "string");

        self.registerApi("доб", /доб (\S+)/, self.add, "добавить новое слово / регулярное выражение / символ в словарь допустимых слов.");
        self.registerApi("старт", /старт/, self.start, "запускает работу бота.");
        self.registerApi("стоп", /стоп/, self.stop, "останавливает работу бота.");
        self.registerApi("плохсброс", /плохсброс/, self.resetBadLineCounter, "сбрасывает счётчик плохих строк.");

        self.loadGoodWords();
        self.genGodWordReg();
    }

    self.resetBadLineCounter = function() {
        badLineCounter = 0;
    }

    self.saveGoodWords = function() {
        writeObjToFile(self.getOption("файл_словаря"), goodWords);
    }


    self.loadGoodWords = function() {
        var wd = readObjectFromFile(self.getOption("файл_словаря"));
        for (var ind in wd) {
            goodWords.push(wd[ind]);
        }
    }

    self.genGodWordReg = function() {
        var tmp = "стоит";
        for (var i = 0; i < goodWords.length; i++) {
            tmp = tmp + "|" + goodWords[i];
        }
        godWordReg = new RegExp(tmp, "i");
    }

    self.add = function(_word) {
        goodWords.push(_word);
        self.saveGoodWords();
        self.clientOutputNamed("'" + _word + "' добавлено.");
        self.genGodWordReg();
    }

    self.start = function() {
        self.setOption("включен", "да");
        self.master.parseInput("лит.таймер.создать " + self.getOption("счётчик") + " " + self.getOption("время_сброса_сч") + " ~лит.мол.плохсброс");
    }

    self.stop = function() {
        self.setOption("включен", "нет");
        self.master.parseInput("лит.таймер.удалить " + self.getOption("счётчик"));
    }

    self.parseIncoming = function(_text) {
        if (self.getOption("включен") === "да") {
            _cleartext = removeColor(_text);

            if (_cleartext === "" || godWordReg.exec(_cleartext) != null) {
                if (self.getOption("позитив") === "да") {
                    _text = _text + color("32;1") + "[+] "  + color("0");
                }
            }
            else
            {
                badLineCounter++;
                if (self.getOption("негатив") === "да") {
                    _text = _text + color("31;1") + " |[" + badLineCounter + "]|" + color("0");
                }
                //self.clientOutputNamed(color("31") + "количество неизвестных строк - " + badLineCounter);
                if (badLineCounter === self.getOption("макс_плохих")) {
                    jmc.play("sounds/chbell.wav");
                    _text = _text + " " + color("41;1") + self.getOption("макс_текст") + color("0");
                }
            }
        }
        return _text;
    }


    self.constructor()

    return self;
}