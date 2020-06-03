litenBotScenarioComposer = function (_master) {
    var self = new absModule(_master);

    //  родительские переменные модуля
    self.apiname = "ск";
    self.name = "Liten bot: scenario composer";
    self.version = "1.0";
    self.description = "Оркестровщик сценариев.";
    self.author = "Литьен";

    var SC_MODE = {
        NONE: 0,
        RUN: 1,
        IDLE: 2
    }

    //  данные по текущему сценарию
    self.scnName = undefined;
    self.cmdCounter = 0;
    self.idleCounter = 0;


    //  собственные переменные
    self.mode = SC_MODE.NONE;
    self.setMode = function (_v) {
        self.clientOutputNamed("mode " + self.mode + " -> " + _v + ".");
        self.mode = _v;
    }
    self.scnList = [];

    //  статистика
    self.stat = {
        runTimer: 0,
        idleTimer: 0
    }

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function () {
        //  настройки модуля - дефолтные значения будут заменены сохранёнными
        self.createOption("файл_оркестровщика", "data/default.orh", "файл оркестровщика", "string");
        self.createOption("файл_статистики_оркестровщика", "data/stat.orh", "файл оркестровщика", "string");
        self.createOption("тм_ск", "300", "идентификатор таймера оркестровщика", "string");
        self.createOption("сц_возврата", "возврат", "сценарий возврата", "string");
        self.createOption("прер_тайм", "3", "время простоя в минутах при котором сценарий прерывается", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модуля - всегда в дефолных настройках при старте
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  регистрация методов api
        self.registerApi("доб", /доб (.+) (\d+)/, self.scnAdd, "добавляет сценарий.");
        self.registerApi("уд", /уд (.+)/, self.scnDel, "удаляет сценарий.");
        self.registerApi("показ", /показ/, self.scnShow, "показывает список сценариев.");
        self.registerApi("сбтайм", /сбтайм (.+)/, self.resetTimer, "сбрасывает таймеры зоны или всех. Пример: лит.сц.сбтайм все - сбросит таймер всех зон, лит.сц.сбтайм все - сбросит таймер зоны 'школа'");
        self.registerApi("сбстат", /сбстат/, self.resetStat, "сбрасывает статистику.");
        self.registerApi("статус", /статус (.+)/, self.switchEnabled, "изменяет статус сценария. Пример: лит.ск.статус школа - изменит статус сценария 'школа' на противоположный текущему.");
        self.registerApi("старт", /старт/, self.start, "запускает выполнение сценариев.");
        self.registerApi("стоп", /стоп/, self.stop, "останавливает выполнение сценариев.");

        self.registerApi("тик", /тик/, self.tick, "тик бота.");

        //  другие методы вызываемые при создании модуля
        self.load();
        self.loadStat();


        self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_ск"));

    }
    //  сохраняет сценарий
    self.save = function () {
        writeObjToFile(self.getOption("файл_оркестровщика"), self.scnList);
    }
    //  загружает сценарии
    self.load = function () {
        self.scnList = readObjectFromFile(self.getOption("файл_оркестровщика"));
    }
    // сохраняет статистику
    self.saveStat = function() {
        writeObjToFile(self.getOption("файл_статистики_оркестровщика"), self.stat);
    }
    // загружает статистику
    self.loadStat = function() {
        self.stat = readObjectFromFile(self.getOption("файл_статистики_оркестровщика"));
    }


    //  добавить сценарий
    self.scnAdd = function (_name, _timer) {
        if (self.scnList[_name] != undefined) {
            self.clientOutputNamed("В списке уже есть '" + _name + "'.")
            return;
        }

        self.scnList[_name] = {
            name: _name,
            timer: _timer,
            enabled: true,
            toRepop: 0,
            coin: 0,
            exp: 0,
            time: 0,
            runCount: 0,
            failRunCount: 0
        };
        self.save();
        self.clientOutputNamed("Добавлен сценарий '" + _name + "' таймер '" + _timer + "'.")
    }
    //  изменяет активность сценария
    self.switchEnabled = function (_name) {
        if (self.scnList[_name] == undefined) {
            self.clientOutputNamed("В списке нет '" + _name + "'.")
            return;
        }

        self.scnList[_name].enabled = !self.scnList[_name].enabled;
        self.save();
        self.clientOutputNamed("Статус сценария '" + _name + "' изменён на '" + self.scnList[_name].enabled + "'.")
    }
    //  удалить сценарий
    self.scnDel = function (_name) {
        if (self.scnList[_name] == undefined) {
            self.clientOutputNamed("В списке нет '" + _name + "'.")
            return;
        }

        delete self.scnList[_name];
        self.save();
        self.clientOutputNamed("Удалён сценарий '" + _name + "'.")
    }

    //  показывает список текущих сценариев
    self.scnShow = function () {
        self.clientOutputMobuleTitle();
        self.clientOutput("Время активности / простоя: " + self.stat.runTimer + " / " + self.stat.idleTimer);
        self.clientOutput("Сценарии:");
        self.clientOutput(tab()
            + "сценарий".padEnd(20)
            + "вкл".toString().padStart(7)
            + "репоп".toString().padStart(7)
            + "тм".toString().padStart(7)
            + "мон/c".toString().padStart(9)
            + "exp/с".toString().padStart(9)
            + "прох".toString().padStart(9)
            + "ошиб".toString().padStart(9)
        );
        for (var key in self.scnList) {
            var scn = self.scnList[key];
            self.clientOutput(tab()
                + scn.name.padEnd(20)
                + scn.enabled.toString().padStart(7)
                + scn.timer.toString().padStart(7)
                + scn.toRepop.toString().padStart(7)
                + (scn.coin / scn.time | 0).toString().padStart(9)
                + (scn.exp / scn.time | 0).toString().padStart(9)
                + scn.runCount.toString().padStart(9)
                + scn.failRunCount.toString().padStart(9)
            );
        }
    }

    //  сбросить таймеры зон
    self.resetTimer = function (_name) {
        if (_name == "все") {
            for (var key in self.scnList) {
                self.scnList[key].toRepop = 0;
            }
            self.clientOutputNamed("Сброшены таймеры всех сценариев.")
        } else {
            if (self.scnList[_name] == undefined) {
                self.clientOutputNamed("В списке нет '" + _name + "'.")
                return;
            }
            self.scnList[_name].toRepop = 0;
            self.clientOutputNamed("Сброшен таймер сценария '" + _name + "'.")
        }
    }
    //  сбрасывает статистику
    self.resetStat = function () {
        for (var key in self.scnList) {
            self.scnList[key].exp = 0;
            self.scnList[key].coin = 0;
            self.scnList[key].time = 0;
            self.scnList[key].runCount = 0;
            self.scnList[key].failRunCount = 0;
        }
        self.save();
        self.clientOutputNamed("Сброшена статистика всех сценариев.");

        self.stat.idleTimer = 0;
        self.stat.runTimer = 0;
        self.saveStat();

        self.clientOutputNamed("Сброшена общая статистика.");
    }

    //  тикер модуля
    self.tick = function () {
        self.minusScnTimer();

        if (self.mode == SC_MODE.IDLE) {
            self.runNextScenario();
            self.stat.idleTimer++;
        }

        if (self.mode == SC_MODE.RUN) {
            if (self.cmdCounter == 0) {
                var idleCounterMax = Number(self.getOption("прер_тайм"));
                self.idleCounter++;
                self.clientOutputNamed("Таймер бездействия " + self.idleCounter + " из " + idleCounterMax + ".")
                if (self.idleCounter == idleCounterMax) {
                    self.clientOutputNamed("таймаут, приостанавливаю сценарий.")
                    self.master.parseInput("лит.сц.прер");
                    self.master.parseInput("лит.сц.выпол " + self.getOption("сц_возврата"));
                    self.scnList[self.scnName].failRunCount++;
                    self.save();
                }
            } else {
                self.idleCounter = 0;
            }
            self.cmdCounter = 0;
            self.stat.runTimer++;
        }
        self.saveStat();
    }

    //  снижает таймер ожидания у всех сценариев
    self.minusScnTimer = function () {
        for (var key in self.scnList) {
            self.scnList[key].toRepop--;
            //self.scnList[key].toRepop = self.scnList[key].toRepop > 0 ? self.scnList[key].toRepop - 1 : 0;
        }
    }

    //  ищет сценарий
    self.scenarioForRun = function () {
        var minVal = 10000;
        var scnName = null;
        for (var key in self.scnList) {
            var scn = self.scnList[key];
            if (scn.enabled && scn.toRepop <= 0 && scn.toRepop < minVal) {
                minVal = scn.toRepop;
                scnName = scn.name;
            }
        }
        return scnName;
    }
    //  запускает следующий сценарий
    self.runNextScenario = function () {
        var scnName = self.scenarioForRun();
        if (scnName !== null) {
            self.clientOutputNamed("Запускаю сценарий '" + scnName + " время репопа " + self.scnList[scnName].toRepop + ".")
            //self.clientOutputNamed("Запускаю сценарий '" + scnName + ".")

            self.scnList[scnName].toRepop = self.scnList[scnName].timer;
            self.master.parseInput("лит.сц.выпол " + self.scnList[scnName].name);
            self.setMode(SC_MODE.RUN);
            self.scnName = scnName;
            return true;
        }
        self.clientOutputNamed("Ожидаю репопа.")
        self.setMode(SC_MODE.IDLE);
        return false;
    }
    //  обработка завершения сценария
    self.scenarioComplete = function (_message, _content) {
        var _stat = _content;
        var scnName = _stat.name;
        if (self.scnList[scnName] !== undefined) {
            self.scnList[scnName].coin = Number(self.scnList[scnName].coin) + _stat.coin;
            self.scnList[scnName].exp = Number(self.scnList[scnName].exp) + _stat.exp;
            self.scnList[scnName].time = Number(self.scnList[scnName].time) + _stat.time;
            self.scnList[scnName].runCount = Number(self.scnList[scnName].runCount) + 1;
            self.save();

            if (self.mode == SC_MODE.RUN) {
                //self.master.parseInput("лит.таймер.создать " + self.getOption("тм_ск") + " 600 ~лит.ск.тик");
                self.runNextScenario();
            }
        }
    }
    //  обработка команды сценария
    self.scenarioStep = function (_message, _content) {
        self.cmdCounter++;
    }

    self.start = function () {
        self.registerReceiver("СценарийЗакончен", self.scenarioComplete);
        self.registerReceiver("СценарийДействие", self.scenarioStep);

        self.master.parseInput("лит.таймер.создать " + self.getOption("тм_ск") + " 600 ~лит.ск.тик");
        self.setMode(SC_MODE.RUN);
        self.runNextScenario();
    }

    self.stop = function () {
        self.removeReceiver("СценарийЗакончен");
        self.removeReceiver("СценарийДействие");

        self.master.parseInput("лит.таймер.удалить " + self.getOption("тм_ск"));
        self.setMode(SC_MODE.NONE);
    }

    //  вызов констурктора
    self.constructor()

    return self;
}