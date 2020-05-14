litenBotScenario = function (_master) {
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

    var KILL_MODE = {
        PASSIVE: 0,
        KILLALL: 1,
        KILLLIST: 2
    }

    //  собственные переменные
    var notInstantActionRX = /^(смотреть|см|север|юг|запад|восток|вверх|вниз|с|ю|з|в|вв|вн|~лит.сц.жд (.+))$/
    var scenarios = {};
    var mobs = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;
    var curScenarioPosition = 0;
    var waitTimer = 0;

    var killMode = KILL_MODE.PASSIVE;
    var mobParseMode = false;

    var inFight = false;
    var inSubAction = false;

    var currentRoom = {};

    var curScenStat = {
        startExp: 0,
        startCoin: 0,
        curExp: 0,
        curCoin: 0,
        reset: function () {
            startExp = 0;
            startCoin = 0;
            curExp = 0;
            curCoin = 0;
        }
    }
    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function () {
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
        self.registerApi("выб", /выб (\S+)/, self.select, "выбрать сценарий.");
        self.registerApi("созд", /созд (\S+)/, self.create, "начать создание нового сценария с указанным именем.");
        self.registerApi("стоп", /стоп/, self.stop, "завершить создание текущего сценария.");
        self.registerApi("показ", /показ/, self.show, "показать команды текущего сценария.");
        self.registerApi("удал", /удал (\S+)/, self.del, "удалить сценарий. Подтверждение не запрашивается. Файл сценария не удаляется.");
        self.registerApi("выпол", /выпол (\S+)/, self.run, "выполнить сценарий.");
        self.registerApi("кудал", /кудал (\S+)/, self.cmdDel, "удалить команду из сценария. кудал НОМЕР_В_СПИСКЕ. Пример: лит.сц.кудал 10 - удалит из сценария команду с номером 10.");

        self.registerApi("жд", /жд (\S+)/, self.botWait, "пауза в сценарии - значение * тм_бот_скор.");
        self.registerApi("тик", /тик/, self.tick, "тик бота.");

        //  работа с мобами
        self.registerApi("мстарт", /мстарт/, self.mobCollectStart, "запускает режим автоматического сбора данных о мобах.");
        self.registerApi("мстоп", /мстоп/, self.mobCollectStop, "отключает режим автоматического сбора данных о мобах.");
        self.registerApi("мдоб", /мдоб (.+) == (.+), (.+), (и|у)/, self.addMob, "добавить нового моба.");
        self.registerApi("муд", /муд (.+)/, self.deleteMob, "удалить моба.");
        self.registerApi("мизм", /мизм (.+) == (.+), (.+), (и|у)/, self.editMob, "редактирование моба.");
        self.registerApi("мопц", /мопц (.+) == (и|у)/, self.mobOptions, "настройки моба. мопц (все / отображаемое название моба / номер в списке) == (y - агрить / и - игнорить). Пример: лит.сц.мопц все == у - установит всем мобам в выбранном сценарии опции у (агрить).");
        self.registerApi("мспис", /мспис/, self.mobList, "список мобов выбранной зоны.");
        self.registerApi("мочис", /мочис/, self.clearMobList, "очищает список мобов выбранной зоны.");

        self.registerApi("убреж", /убреж (0|1|2)/, self.setKillMode, "установка режима агресси (0 - нет; 1 - агрит всех; 2 - агрит только мобов и списка выбранной зоны).");


        self.registerApi("см", /см/, self.look, "(метод для тестирования) получить комнату.");

        //  другие методы вызываемые при создании модуля
        self.loadScenarios();

        self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_бот"));
    }

    //  установка режима агро
    self.setKillMode = function (_mode) {
        killMode = _mode;
        self.clientOutputNamed("Режим агро установлен в значение '" + _mode + "'.");
    }

    //  запускает режим автоматического сбора данных о мобах
    self.mobCollectStart = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления мобов.");
            return;
        }

        self.clientOutputMobuleTitle("Записываются мобы для сценария '" + curScenario + "'.");

        self.registerReceiver("Комната", self.roomReady);
        self.registerReceiver("Моб", self.mobReady);

        mobParseMode = true;
    }

    //  отключает режим автоматического сбора данных о мобах
    self.mobCollectStop = function () {
        self.removeReceiver("Комната");
        self.removeReceiver("Моб");

        self.clientOutputMobuleTitle("Запись мобов для сценария '" + curScenario + "' закончена.");

        mobParseMode = false;
    }

    //  посмотреть комнату
    self.doLook = function() {
        jmc.parse("смотреть");
    }

    //  обработка новой комнаты
    self.roomReady = function (_message, _content) {
        currentRoom = _content;
        var roomMobs = currentRoom.mobs;

        //  автосбор мобов (для былин не работает)
        if (mobParseMode && roomMobs.length > 0) {
            currentMobIndex = 0;
            newMobArray = [];

            for (var i = 0; i < roomMobs.length; i++) {
                if (mobs[curScenario][roomMobs[i].trim()] === undefined) {
                    jmc.parse("смотреть " + (i + 2));
                    newMobArray.push(roomMobs[i]);
                }
            }
        }
        //  обработка режима "агрит всех"
        if (parseInt(killMode) === KILL_MODE.KILLALL) {
            //  todo: не обязательно будет видно строку статуса, иногда килл а один раунд
            //log(gurmStringify(_content));
            if (roomMobs.length > 0) {
                self.killMob(0);
                return;
            }
        }

        //  обработка режима "агрит по списку"
        if (parseInt(killMode) === KILL_MODE.KILLLIST && curScenario !== undefined) {
            for (var i = 0; i < roomMobs.length; i++) {
                var displayMob = roomMobs[i].trim();
                if (mobs[curScenario][displayMob] !== undefined && mobs[curScenario][displayMob].option === "у") {
                    //self.registerReceiver("СтатусБитвы", self.inFightChange);
                    self.killMob(mobs[curScenario][displayMob].shortName);
                    return;
                }
            }
        }

        if (mode === SC_MODE.RUN && self.canAct()) {
            self.scenarioNextStep();
        }
    }

    //  обработка статуса
    self.statusReady = function (_message, _content) {
        if (curScenStat.startExp === 0) {
            curScenStat.startExp = _content.exp;
            curScenStat.startCoin = _content.coin;
        }
        curScenStat.curExp = _content.exp;
        curScenStat.curCoin = _content.coin;
    }


    //  обработка изменения состояния в битве
    self.inFightChange = function (_message, _content) {
        self.clientOutputNamed("В битве: " + _content);
        inFight = _content;
        if (!_content) {
            //self.removeReceiver("СтатусБитвы");
            jmc.parse("смотреть");
        }
    }

    self.killMob = function (_name) {
        if (typeof (_name) === "number") {
            _name = _name + 2;
        }
        self.clientOutputNamed("Атакую моба '" + _name + "'");
        jmc.parse("убить " + (_name))
    }

    //  обработка нового моба
    //  todo: вот эту ерунду надо убирать конечно
    var currentMobIndex = 0;
    var newMobArray = [];
    self.mobReady = function (_message, _content) {
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
    self.addMob = function (_disp, _real, _shortName, _option) {
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

    // изменяет моба
    self.editMob = function (_disp, _real, _shortName, _option) {
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
    //  изменияет настройки моба
    self.mobOptions = function (_disp, _option) {
        _disp = _disp.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления моба.");
            return;
        }

        if ((isNaN(Number(_disp)) || Number(_disp) > mobs[curScenario].length) && _disp !== "все" && mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("В сценарии '" + curScenario + "' нет моба '" + _disp + "'.")
            return;
        }

        if (!isNaN(Number(_disp))) {
            var mobIndex = Number(_disp);
            var counter = 1;
            for (var _key in mobs[curScenario]) {
                if (counter === mobIndex) {
                    _disp = _key;
                }
                counter++;
            }
        }

        if (_disp === "все") {
            for (var _key in mobs[curScenario]) {
                self.mobOpt(_key, _option);
            }
        } else {
            self.mobOpt(_disp, _option);
        }

        self.saveScenario(curScenario);
    }

    self.mobOpt = function(_disp, _option) {
        mobs[curScenario][_disp].option = _option;
        self.clientOutputNamed("В сценарии '" + curScenario + "' изменён моб '" + _disp + "' опции '" + _option + "'.")
    }

    //  удаляет моба из сценария
    self.deleteMob = function (_disp) {
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
    self.clearMobList = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для очистки списка мобов.");
            return;
        }
        delete mobs[curScenario];
        mobs[curScenario] = [];
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарии '" + curScenario + "' очищен список мобов.")
    }

    self.run = function (_name) {
        _name = _name === '' ? curScenario : _name;
        if (!self.select(_name)) {
            return false;
        }

        mode = SC_MODE.RUN;
        self.clientOutputMobuleTitle();
        self.clientOutputNamed("Сценарий '" + _name + "' запущен.")
        curScenarioPosition = 0;
        curScenStat.reset();


        self.registerReceiver("Комната", self.roomReady);
        self.registerReceiver("Состояние", self.statusReady);
        //self.registerReceiver("ОшибкаДвиженияБоя", self.scenarioRollBackStep);
        self.registerReceiver("СтатусБитвы", self.inFightChange);
        self.registerReceiver("ОшибкаНетМобаАгро", self.doLook);

        if (self.canAct()) {
            self.scenarioNextStep();
        }

        self.master.parseInput("лит.таймер.создать " + self.getOption("тм_бот") + " " + self.getOption("тм_бот_скор") + " ~лит.сц.тик");
    }

    self.tick = function () {
        if (mode === SC_MODE.WAIT) {
            self.clientOutputNamed("Сценарий '" + curScenario + "' ждём: " + waitTimer + ".")
            waitTimer--;
            if (waitTimer === 0) {
                mode = SC_MODE.RUN;
                self.scenarioNextStep()
            }
            return;
        }
    }

    self.scenarioRollBackStep = function() {
        curScenarioPosition--;
        var scenario = scenarios[curScenario];
        var cmd = scenario[curScenarioPosition];
        self.clientOutputNamed("Сценарий '" + curScenario + "' возврат на команду: " + cmd + ".")
    }

    self.scenarioNextStep = function () {
        var scenario = scenarios[curScenario];
        var cmd = "";

        do {
            cmd = scenario[curScenarioPosition];
            self.clientOutputNamed("Сценарий '" + curScenario + "' команда: " + cmd + ".")
            self.action(cmd);
            curScenarioPosition++;
        } while (self.instantAction(cmd) && curScenarioPosition < scenario.length);

        if (curScenarioPosition >= scenario.length) {
            mode = SC_MODE.READY;
            self.removeReceiver("Комната");
            self.removeReceiver("Состояние");
            self.removeReceiver("СтатусБитвы");
            //self.removeReceiver("ОшибкаДвиженияБоя");
            self.removeReceiver("ОшибкаНетМобаАгро");

            self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_бот"));

            self.clientOutputMobuleTitle();
            self.clientOutputNamed("Сценарий '" + curScenario + "' выполнен.")
            self.clientOutputNamed("Опыт: " + (curScenStat.startExp - curScenStat.curExp));
            self.clientOutputNamed("Монет: " + (curScenStat.curCoin - curScenStat.startCoin));
        }
    }

    self.instantAction = function(_action) {
        return !regexp(notInstantActionRX, _action);
    }

    self.canAct = function () {
        return !inFight && !inSubAction;
    }

    self.command = function (_cmd) {
        self.action(_cmd);
    }

    self.del = function (_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        delete scenarios[_name];
        self.saveScenarios();
        self.clientOutputNamed("Сценарий '" + _name + "' удалён.")
    }

    self.saveScenarios = function () {
        var scList = {};
        for (name in scenarios) {
            scList[name] = {};
        }
        writeObjToFile(self.getOption("дир_сценариев") + "scenarios.lst", scList);
    }

    self.loadScenarios = function () {
        scenarios = readObjectFromFile(self.getOption("дир_сценариев") + "scenarios.lst");
        self.clientOutputNamed("Загружен список сценариев");
        for (name in scenarios) {
            scenarios[name] = self.loadScenario(name);
            mobs[name] = self.loadMobs(name);
        }
    }

    //  сохраняет сценарий
    self.saveScenario = function (_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return;
        }
        writeObjToFile(self.getOption("дир_сценариев") + _name + ".scn", scenarios[_name]);
        writeObjToFile(self.getOption("дир_сценариев") + _name + ".mob", mobs[_name]);
    }

    //  загружает сценарий
    self.loadScenario = function (_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("дир_сценариев") + _name + ".scn");
        for (var ind in wd) {
            result.push(wd[ind]);
        }
        return result;
    }

    //  загружает мобов сценария
    self.loadMobs = function (_name) {
        return readObjectFromFile(self.getOption("дир_сценариев") + _name + ".mob");
    }

    self.list = function () {
        self.clientOutputMobuleTitle();
        self.clientOutput("Сценарии:");
        for (var name in scenarios) {
            self.clientOutput(tab() + (name === curScenario ? "* " : "  ") + name + " (" + scenarios[name].length + ")");
        }
    }

    self.select = function (_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("Сценарий '" + _name + "' не существует.");
            return false;
        }
        self.clientOutputNamed("Сценарий '" + _name + "' выбран.");
        curScenario = _name;
        return true;
    }

    self.create = function (_name) {
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

    self.stop = function () {
        self.clientOutputNamed("Сценарий '" + curScenario + "' завершён. Действий в сценарии - " + scenarios[curScenario].length + ".");
        mode = SC_MODE.READY;
        curScenario = undefined;
    }

    self.add = function (_command, _pos) {
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

    //  удаляет команду из сценария
    self.cmdDel = function(_pos) {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий для добавления команды.");
            return;
        }

        if (_pos > scenarios[curScenario]) {
            self.clientOutputNamed("В сценарий '" + curScenario + "' нет команды с номером '" + _pos + "'.");
            return;
        }
        var cmd = scenarios[curScenario][_pos - 1];
        scenarios[curScenario].splice(_pos - 1, 1);
        self.saveScenario(curScenario);
        self.clientOutputNamed("В сценарий '" + curScenario + "' удалена команда с номером '" + _pos + "' ('" + cmd + "').");
    }

    // список мобов в сценарии
    self.mobList = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("Мобы в сценарий '" + curScenario + "':");
        var counter = 0;
        for (var disp in mobs[curScenario]) {
            counter++;
            var mob = mobs[curScenario][disp];
            self.clientOutput(tab() + (counter).toString().padStart(3) + ". [" + mob.option + "] " + disp + " | " + mob.real + " | " + mob.shortName);
        }
    }


    self.show = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("Выберите сценарий.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("Сценарий '" + curScenario + "':");
        for (var i = 0; i < scenarios[curScenario].length; i++) {
            self.clientOutput(tab() + (i + 1).toString().padStart(3) + ". " + scenarios[curScenario][i]);
        }
    }
    //  bot command section
    self.botWait = function (_time) {
        mode = SC_MODE.WAIT;
        waitTimer = parseInt(_time);
    }

    var parentParseInput = self.parseInput;
    self.parseInput = function (_text) {
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

    self.parseIncoming = function (_text) {
        //todo: надо бы чтобы парсинг был только на секции мобов
        if (curScenario !== undefined) {
            _cleartext = removeColor(_text).trim();
            if (mobs[curScenario][_cleartext] !== undefined) {
                _text = _text + " [" + mobs[curScenario][_cleartext].shortName + "]";
            }
        }
        return _text;
    }


    //  вызов констурктор
    self.constructor()

    return self;
}