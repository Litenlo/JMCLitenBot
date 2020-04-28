litenBotModuleTemplate = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модул€
    self.apiname = "темп";
    self.name = "Liten bot: template module";
    self.version = "0.0";
    self.description = "ўаблон модул€.";
    self.author = "unknown";

    //  собственные переменные

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  настройки модул€ - дефолтные значени€ будут заменены сохранЄнными
        self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модул€ - всегда в дефолных настройках при старте
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  регистраци€ методов api
        ///self.registerApi("доб", /доб (\S+)/, self.add, "добавить новое слово / регул€рное выражение / символ в словарь допустимых слов.");

        //  другие методы вызываемые при создании модул€
    }


    self.start = function() {
        self.setOption("включен", "да");
        self.master.parseInput("лит.таймер.создать " + self.getOption("счЄтчик") + " " + self.getOption("врем€_сброса_сч") + " ~лит.мол.плохсброс");
    }

    self.stop = function() {
        self.setOption("включен", "нет");
        self.master.parseInput("лит.таймер.удалить " + self.getOption("счЄтчик"));
    }

    //  обработка вход€щих сообщений
    var parentParseInput = self.parseInput;
    self.parseInput = function(_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        return _text;
    }

    //  вызов констурктор
    self.constructor()

    return self;
}