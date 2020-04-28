litenBotScenario = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модуля
    self.apiname = "сц";
    self.name = "Liten bot: scenario";
    self.version = "1.0";
    self.description = "Модуль для создания сценариев.";
    self.author = "Литьен";

    //
    var SC_MODE = {
        READY: 0,
        CREATE: 1
    }

    //  собственные переменные
    var scenarios = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  настройки модуля - дефолтные значения будут заменены сохранёнными
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");
        self.createOption("дир_сценариев", "data/scenario/", "директория для сценариев", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модуля - всегда в дефолных настройках при старте
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  регистрация методов api
        self.registerApi("спис", /спис/, self.list, "показать список доступных сценариев.");
        self.registerApi("созд", /созд (\S+)/, self.create, "начать создание нового сценария с указанным именем.");
        self.registerApi("выб", /выб (\S+)/, self.select, "выбрать сценарий.");
        self.registerApi("стоп", /стоп/, self.stop, "завершить создание текущего сценария.");
        self.registerApi("показ", /показ/, self.show, "показать команды текущего сценария.");
        self.registerApi("удал", /удал (\S+)/, self.del, "удалить сценарий. Подтверждение не запрашивается. Файл сценария не удаляется.");
        self.registerApi("выпол", /выпол (\S+)/, self.run, "выполнить сценарий.");

        //  другие методы вызываемые при создании модуля
        self.loadScenarios();
    }

    self.run = function(_name) {
        _name = _name === '' ? curScenario : _name;
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }

        self.clientOutputMobuleTitle();
        self.clientOutputNamed("Сценарий '" + _name + "' запущен.")

        var scenario = scenarios[_name];
        for (var i = 0; i < scenario.length; i++) {
            var cmd = scenario[i];
            self.command(cmd);
        }
    }

    self.command = function(_cmd) {
        self.action(_cmd);
    }

    self.del = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        delete scenarios[_name];
        self.saveScenarios();
        self.clientOutputNamed("Сценарий '" + _name + "' удалён.")
    }

    self.saveScenarios = function() {
        var scList = {};
        for (name in scenarios) {
            scList[name] = {};
        }
        writeObjToFile(self.getOption("дир_сценариев") + "scenarios.lst", scList);
    }

    self.loadScenarios = function() {
        scenarios = readObjectFromFile(self.getOption("дир_сценариев") + "scenarios.lst");
        self.clientOutputNamed("Загружен список сценариев");
        for (name in scenarios) {
            scenarios[name] = self.loadScenario(name);
        }
    }

    self.loadScenario = function(_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("дир_сценариев") + _name + ".scn");
        for (var ind in wd) {
            result.push(wd[ind]);
        }
        return result;
    }

    self.saveScenario = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        writeObjToFile(self.getOption("дир_сценариев") + _name + ".scn", scenarios[_name]);
    }

    self.list = function() {
        self.clientOutputMobuleTitle();
        self.clientOutput("Сценарии:");
        for (var name in scenarios) {
            self.clientOutput(tab() + (name === curScenario ? "* " : "  ") + name + " (" + scenarios[name].length + ")");
        }
    }

    self.select = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        self.clientOutputNamed("Сценарий '" + _name + "' выбран.");
        curScenario = _name;
    }

    self.create = function(_name) {
        if (scenarios[_name] !== undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' уже существует.");
            return;
        }

        scenarios[_name] = [];
        self.select(_name);
        self.clientOutputNamed("Сценарий '" + _name + "' записывается.");
        mode = SC_MODE.CREATE;

        self.saveScenarios()
    }

    self.stop = function() {
        self.clientOutputNamed("Сценарий '" + curScenario + "' завершён. Действий в сценарии - " + scenarios[curScenario].length + ".");
        mode = SC_MODE.READY;
        curScenario = undefined;
    }

    self.add = function(_command, _pos) {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления команды.");
            return;
        }

        if (_pos === undefined) {
            scenarios[curScenario].push(_command)
        } else {
            scenarios[curScenario].splice(_pos, 0, _command)
        }
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарий '" + curScenario + "' добавлена команда '" + _command + "'.");
    }

    self.show = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("Сценарий '" + curScenario + "':");
        for (var i = 0; i < scenarios[curScenario].length; i++) {
            self.clientOutput(tab() + i + ". " + scenarios[curScenario][i]);
        }
    }

    var parentParseInput = self.parseInput;
    self.parseInput = function(_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        if (mode === SC_MODE.CREATE) {
            self.add(_text);
        }
        return _text;
    }

    //  вызов констурктор
    self.constructor()

    return self;
}