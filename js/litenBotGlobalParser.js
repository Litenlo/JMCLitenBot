litenBotGlobalParser = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модул€
    self.apiname = "парс";
    self.name = "Liten bot: global parser";
    self.version = "1.0";
    self.description = "√лобальный парсер.";

    //  собственные переменные
    var parsers = [];

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  настройки модул€ - дефолтные значени€ будут заменены сохранЄнными
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модул€ - всегда в дефолных настройках при старте
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  регистраци€ методов api
        ///self.registerApi("доб", /доб (\S+)/, self.add, "добавить новое слово / регул€рное выражение / символ в словарь допустимых слов.");

        //  другие методы вызываемые при создании модел€
        self.registerParser(/(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)C/, self.psPrompt);
    }

    self.registerParser = function(_rx, _fnc) {
        parsers.push({rx: _rx, fnc: _fnc});
    }

    self.psPrompt = function(_hp, _mn, _mv, _exp, _meg) {
        /*
        self.clientOutputNamed("хиты " + _hp);
        self.clientOutputNamed("мана " + _mn);
        self.clientOutputNamed("мувы " + _mv);
        self.clientOutputNamed("эксп " + (_meg === "M" ? _exp * 1000 : _exp));
         */
    }

    //  обработка вход€щих сообщений
    self.parseIncoming = function(_text) {
        _cleartext = removeColor(_text);
        for (var i = 0; i < parsers.length; i++) {
            var parseInfo = parsers[i];
            if (regexp(parseInfo.rx, _cleartext)) {
                fnc = parseInfo.fnc;
                var params = regexpResult;
                params.shift();
                fnc.apply(this, params);
            }
        }
        return _text;
    }

    //  вызов констурктор
    self.constructor()

    return self;
}