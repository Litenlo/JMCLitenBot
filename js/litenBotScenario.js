litenBotScenario = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модуля
    self.apiname = "сц";
    self.name = "Liten bot: scenario";
    self.version = "1.1";
    self.description = "Модуль для создания сценариев.";
    self.author = "Литьен";

    //
    var SC_MODE = {
        READY: 0,
        CREATE: 1,
        RUN: 2,
        WAIT: 3
    }

    //  собственные переменные
    var scenarios = {};
    var mobs = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;
    var curScenarioPosition = 0;
    var waitTimer = 0;

    var currentRoom = {};

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  настройки модуля - дефолтные значения будут заменены сохранёнными
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");
        self.createOption("дир_сценариев", "data/scenario/", "директория для сценариев", "string");
        self.createOption("тм_бот", "200", "идентификатор таймера бота", "string");
        self.createOption("сч_ждать", "201", "идентификатор таймера для ожидания", "string");
        self.createOption("тм_бот_скор", "1", "скорость бота в десятый долях секунды", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модуля - всегда в дефолных настройках при старте

        //  регистрация методов api
        self.registerApi("спис", /спис/, self.list, "показать список доступных сценариев.");
        self.registerApi("созд", /созд (\S+)/, self.create, "начать создание нового сценария с указанным именем.");
        self.registerApi("мстарт", /мстарт/, self.mobCollectStart, "запускает режим автоматического сбора данных о мобов.");
        self.registerApi("мстоп", /мстоп/, self.mobCollectStop, "отключает режим автоматического сбора данных о мобов.");
        self.registerApi("выб", /выб (\S+)/, self.select, "выбрать сценарий.");
        self.registerApi("стоп", /стоп/, self.stop, "завершить создание текущего сценария.");
        self.registerApi("показ", /показ/, self.show, "показать команды текущего сценария.");
        self.registerApi("удал", /удал (\S+)/, self.del, "удалить сценарий. Подтверждение не запрашивается. Файл сценария не удаляется.");
        self.registerApi("выпол", /выпол (\S+)/, self.run, "выполнить сценарий.");

        self.registerApi("жд", /жд (\S+)/, self.botWait, "пауза в сценарии - значение * тм_бот_скор.");
        self.registerApi("тик", /тик/, self.tick, "тик бота.");

        //  работа с мобами
        self.registerApi("мдоб", /мдоб (.+) == (.+), (.+), (и|у)/, self.addMob, "добавить нового моба.");
        self.registerApi("муд", /муд (.+)/, self.deleteMob, "удалить моба.");
        self.registerApi("мизм", /мизм (.+) == (.+), (.+), (и|у)/, self.mobOptions, "настройки моба.");
        self.registerApi("мспис", /мспис/, self.mobList, "список мобов выбранной зоны.");
        self.registerApi("мочис", /мочис/, self.clearMobList, "очищает список мобов выбранной зоны.");

        self.registerApi("см", /см/, self.look, "(метод для тестирования) получить комнату.");

        //  другие методы вызываемые при создании модуля
        self.loadScenarios();

        self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_бот"));
    }

    //  запускает режим автоматического сбора данных о мобах
    self.mobCollectStart = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления мобов.");
            return;
        }

        self.clientOutputMobuleTitle("Записываются мобы для сценария '" + curScenario + "'.");

        self.registerReceiver("Комната", self.roomReady);
        self.registerReceiver("Моб", self.mobReady);
    }

    //  отключает режим автоматического сбора данных о мобах
    self.mobCollectStop = function() {
        self.removeReceiver("Комната");
        self.removeReceiver("Моб");

        self.clientOutputMobuleTitle("Запись мобов для сценария '" + curScenario + "' закончена.");
    }

    //  обработка новой комнаты
    self.roomReady = function(_message, _content) {
        currentRoom = _content;
        var roomMobs = currentRoom.mobs;
        if (roomMobs.length > 0) {
            currentMobIndex = 0;
            newMobArray = [];

            for (var i = 0; i < roomMobs.length; i++) {
                if (mobs[curScenario][roomMobs[i].trim()] === undefined) {
                    jmc.parse("смотреть " + (i+2));
                    newMobArray.push(roomMobs[i]);
                }
            }
        }
    }

    //  обработка нового моба
    //  todo: вот эту ерунду надо убирать конечно
    var currentMobIndex = 0;
    var newMobArray = [];
    self.mobReady = function(_message, _content) {
        //  хотфикс, если статус попадает на туже строку, что название (часто такое бывает)
        var parts = _content.name.split("> ");
        _content.name = parts.length === 1 ? _content.name : parts[1];
        /////
        _content.shortName = _content.name.toLowerCase().replace(" ", ".");
        self.clientOutputNamed((currentMobIndex + 1) + " из " + newMobArray.length + ": " + newMobArray[currentMobIndex] + " => " + _content.shortName);
        self.addMob(newMobArray[currentMobIndex], _content.name, _content.shortName, "и")
        currentMobIndex++;
    }

    //  добавляет нового моба к сценарию
    self.addMob = function(_disp, _real, _shortName, _option) {
        _disp = _disp.trim();
        _real = _real.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления моба.");
            return;
        }
        if (mobs[curScenario][_disp] !== undefined) {
            self.clientOutputNamed("В сценарии '" + curScenario + "' уже есть моб '" + _disp + "'.")
            return;
        }
        mobs[curScenario][_disp] = {real: _real, shortName: _shortName, option: _option};
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарий '" + curScenario + "' добавлен моб '" + _disp + "'.")
    }

    // изменяет настройки моба
    self.mobOptions = function(_disp, _real, _shortName, _option) {
        _disp = _disp.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления моба.");
            return;
        }
        if (mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("В сценарии '" + curScenario + "' нет моба '" + _disp + "'.")
            return;
        }
        mobs[curScenario][_disp] = {real: _real, shortName: _shortName, option: _option};
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарии '" + curScenario + "' изменён моб '" + _disp + "'.")
    }

    //  удаляет моба из сценария
    self.deleteMob = function(_disp) {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для удаления моба.");
            return;
        }
        if (mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("В сценарии '" + curScenario + "' нет моб '" + _disp + "'.")
            return;
        }
        delete mobs[curScenario][_disp];
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарии '" + curScenario + "' удалён моб '" + _disp + "'.")
    }

    //  очищает список мобов выбранной зоны
    self.clearMobList = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для очистки списка мобов.");
            return;
        }
        delete mobs[curScenario];
        mobs[curScenario] = [];
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарии '" + curScenario + "' очищен список мобов.")
    }

    self.run = function(_name) {
        _name = _name === '' ? curScenario : _name;
        if (!self.select(_name)) {
            return false;
        }

        mode = SC_MODE.RUN;
        self.clientOutputMobuleTitle();
        self.clientOutputNamed("Сценарий '" + _name + "' запущен.")
        curScenarioPosition = 0;

        self.master.parseInput("лит.таймер.создать " + self.getOption("тм_бот") + " " + self.getOption("тм_бот_скор") + " ~лит.сц.тик");
    }

    self.tick = function() {
        if (mode === SC_MODE.WAIT) {
            self.clientOutputNamed("Сценарий '" + curScenario + "' ждём: " + waitTimer + ".")
            waitTimer--;
            if (waitTimer === 0) {
                mode = SC_MODE.RUN;
            }
            return;
        }

        var scenario = scenarios[curScenario];
        var cmd = scenario[curScenarioPosition];
        self.clientOutputNamed("Сценарий '" + curScenario + "' команда: " + cmd + ".")
        self.action(cmd);
        curScenarioPosition++;
        if (curScenarioPosition >= scenario.length) {
            mode = SC_MODE.READY;
            self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_бот"));

            self.clientOutputMobuleTitle();
            self.clientOutputNamed("Сценарий '" + curScenario + "' выполнен.")
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
            mobs[name] = self.loadMobs(name);
        }
    }

    //  сохраняет сценарий
    self.saveScenario = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        writeObjToFile(self.getOption("дир_сценариев") + _name + ".scn", scenarios[_name]);
        writeObjToFile(self.getOption("дир_сценариев") + _name + ".mob", mobs[_name]);
    }

    //  загружает сценарий
    self.loadScenario = function(_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("дир_сценариев") + _name + ".scn");
        for (var ind in wd) {
            result.push(wd[ind]);
        }
        return result;
    }

    //  загружает мобов сценария
    self.loadMobs = function(_name) {
        return readObjectFromFile(self.getOption("дир_сценариев") + _name + ".mob");
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
            return false;
        }
        self.clientOutputNamed("Сценарий '" + _name + "' выбран.");
        curScenario = _name;
        return true;
    }

    self.create = function(_name) {
        if (scenarios[_name] !== undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' уже существует.");
            return;
        }

        scenarios[_name] = [];
        mobs[_name] = [];
        self.select(_name);
        self.clientOutputMobuleTitle("Сценарий '" + _name + "' записывается.");
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

    // список мобов в сценарии
    self.mobList = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("Мобы в сценарий '" + curScenario + "':");
        for (var disp in mobs[curScenario]) {
            var mob = mobs[curScenario][disp];
            self.clientOutput(tab() + "[" + mob.option + "] " + disp + " | " + mob.real  + " | " + mob.shortName);
        }
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
    //  bot command section
    self.botWait = function(_time) {
        mode = SC_MODE.WAIT;
        waitTimer = parseInt(_time);
    }

    var parentParseInput = self.parseInput;
    self.parseInput = function(_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        if (mode === SC_MODE.CREATE) {
            self.add(_text);
            if (_text.charAt(0) === "~") {
                _text = "";
            }
        }
        return _text;
    }

    self.parseIncoming = function(_text) {
        //todo: надо бы чтобы парсинг был только на секции мобов
        if (curScenario !== undefined) {
            _cleartext = removeColor(_text).trim();
            if (mobs[curScenario][_cleartext] !== undefined) {
                _text = _text + " [" + mobs[curScenario][_cleartext].real + "]";
            }
        }
        return _text;
    }


    //  вызов констурктор
    self.constructor()

    return self;
}