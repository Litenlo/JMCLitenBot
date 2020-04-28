 litenBotTimers = function(_master) {
    var self = new absModule(_master);

    self.apiname = "таймер";
    self.name = "Liten bot: timers";
    self.version = "1.0";
    self.description = "Работа с глобальными таймерами. Полезно для периодических действий.";
    self.author = "Литьен";

    var timers = [];

    var parentConstructor = self.constructor;
    self.constructor = function() {
        parentConstructor();
        self.registerApi("создать", /создать (\S+) (\S+) (.*)/, self.create, "создать новый таймер. Параметры id - идентификатор (число), msec - миллисекунда (число), fnc / text - действие на таймер (строка). Пример: BOTNAME." + self.apiname + ".create 777 100 улыб - будет улыбаться каждые 10 секунд.");
        self.registerApi("удалить", /удалить (.*)/, self.kill, "удалить таймер. Параметры id - идентификатор (число).");
        self.registerApi("список", "список", self.list, "показыает список таймеров.");

        self.createOption("файл_таймеров", "data/timer_data.dat", "файл для сохранения таймеров", "string");
        self.createOption("сраб_показ", "нет", "показывать сообщение при срабатывании таймера", "string");

        //restart saved timers
        var saved_timers = readObjectFromFile(self.getOption("файл_таймеров"))
        for (var id in saved_timers) {
            self.create(id, saved_timers[id].msec, saved_timers[id].fnc);
        }
    }

    self.create = function(_id, _msec, _fnc) {
        timers[_id] = {fnc: _fnc, msec: _msec};
        jmc.SetTimer(_id, _msec);
        self.clientOutputNamed("Запущен таймер '" + _id + "' период '" + _msec + "' мсек.");

        writeObjToFile(self.getOption("файл_таймеров"), timers);
    };

    self.kill = function(_id) {
        delete timers[_id];
        jmc.KillTimer(_id);
        self.clientOutputNamed("Остановлен таймер '" + _id + "'.");

        writeObjToFile(self.getOption("файл_таймеров"), timers);
    }

    self.list = function() {
        self.clientOutput("\r\nСписок таймеров:");
        for (var name in timers) {
            self.clientOutput(tab() + name + " - " + timers[name].msec + " мсек: " + timers[name].fnc);
        }
        self.clientOutput("");
    }

    self.onTimer = function() {
        var timerId = jmc.Event;
        if (timers[timerId] !== undefined ) {
            var action = timers[timerId].fnc;
            self.action(action);
            if (self.getOption("сраб_показ") === "да") {
                self.clientOutputNamed("Сработал таймер '" + timerId + "'.");
            }
        }
    }

    self.constructor();

    return self;
}