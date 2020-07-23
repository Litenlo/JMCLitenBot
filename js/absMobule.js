absModule = function(_master) {

    var self = this;
    self.apiname = "abs";
    self.name = "Abstract mobule";
    self.version = "1.0";
    self.description = "simple abstract module";
    self.author = "unknown";
    self.options = {};
    self.api = {};
    self.modules = [];
    self.receivers = [];
    self.master = _master;

    self.createOption = function(_name, _value, _description, _type) {
        self.options[_name] = {value: _value, description: _description, type: _type};
    }

    self.constructor = function() {
        self.registerApi("помощь", "помощь", self.showHelp, "справка по модулю");
        self.registerApi("настр", "настр", self.showOptions, "настройки модуля");
        self.registerApi("уст", /уст (\S+) (.*)/, self.setOption, "изменить настройку. set NAME VALUE");

        self.createOption("конфиг", "data/" + self.apiname + ".cfg", "файл конфигурации (не изменять)", "string");

        // restore config from file
        //var savedConfig = {};
        var savedConfig = self.loadConfig();
        for (var name in savedConfig) {
            var optionInfo = savedConfig[name];
            self.setOption(name, optionInfo.value);
        }
    }

    self.clientOutput = function(_text) {
        jmc.showme(_text);
    }

    self.clientOutputNamed = function(_text) {
        jmc.showme(color("30;1") + "[" + self.name + "] " + _text);
    }

    self.registerApi = function(_name, _reg, _function, _desc){
        self.api[_name] = {
            name: _name,
            reg: _reg,
            fnc: _function,
            desc: _desc
        };
    }

    //  регистрирует нового слушателя
    self.registerReceiver = function(_message, _fnc) {
        self.receivers[_message] = _fnc;
        self.master.addListener(_message, self);
    }
    //  удаляем слушателя
    self.removeReceiver = function(_message) {
        delete self.receivers[_message];
        self.master.removeListener(_message, self);
    }

    //  обрабатывает входящие сообщения и передаёт их обработчику
    self.receiveMessage = function(_message, _content) {
        if (self.receivers[_message] === undefined) {
            self.clientOutputNamed("Не зарегистрирован обработчик для сообщения '" + _message + "'.");
            return;
        }
        var fnc = self.receivers[_message];
        fnc(_message, _content);
    }

    self.saveConfig = function() {
        writeObjToFile(self.getOption("конфиг"), self.options);
    }

    self.loadConfig = function() {
        return readObjectFromFile(self.getOption("конфиг"));
    }

    self.setOption = function(_name, _value) {
        if (self.options[_name] !== undefined) {
            var option = self.options[_name];
            if (option.type === undefined || typeof _value === option.type) {
                self.options[_name].value = _value;
                self.clientOutputNamed("Параметр '" + _name + "': " + _value);
                self.saveConfig();
            } else {
                self.clientOutputNamed("Необходимо передать '" + option.type + "' для '" + _name + "'.");
            }
        } else {
            self.clientOutputNamed("Неизвестный параметр '" + _name + "'.");
        }
    }

    self.getOption = function(_name) {
        if (self.options[_name] !== undefined) {
            return self.options[_name].value;
        } else {
            self.clientOutputNamed("Неизвестный параметр '" + _name + "'.");
        }

        return null;
    }

    self.clientOutputMobuleTitle = function(_text) {
        self.clientOutput("");
        self.clientOutput(color("36;1") + self.name + " v"  + self.version + " by " + self.author);
        self.clientOutput(_text);
    }

    self.showOptions = function() {
        self.clientOutputMobuleTitle();
        self.clientOutput(color("37;1") + "Настройки:");
        for (var name in self.options) {
            var optionInfo = self.options[name];
            self.clientOutput(tab() + name + ": " + optionInfo.value + " - " + optionInfo.description);
        }
        self.clientOutput("");
    }

    self.addModule = function(_module) {
        self.modules.push({
                module: _module,
                enable: true
            }
        )
    }

    self.showHelp = function() {
        self.clientOutputMobuleTitle();
        self.clientOutput(color("36") + self.description);
        self.clientOutput("");

        if (self.modules.length > 0) {
            self.clientOutput(color("37;1") + "Подключенные модули:");
            for (var i = 0; i < self.modules.length; i++) {
                var moduleInfo = self.modules[i];
                self.clientOutput(tab() + "(" + moduleInfo.module.apiname + ") " + moduleInfo.module.name + " v" + moduleInfo.module.version + ": " + moduleInfo.enable);
            }

            self.clientOutput("");
        }

        self.clientOutput(color("37;1") + "Доступные вызовы:");
        for (var name in self.api) {
            var apiFnc = self.api[name];
            self.clientOutput(tab() + self.apiname + "." + apiFnc.name + " - " + apiFnc.desc);
        }

        self.clientOutput("");
    }

    self.action = function(action) {
        if (typeof action === "string") {
            if (action.charAt(0) === "~") {
                self.master.parseInput(action.substr(1));
            } else {
                jmc.parse(action.charAt(0) === "'" ? action.substr(1) : action);
            }
        } else {
            action();
        }
    }

    self.parseInput = function(_text) {
        if (regexp(new RegExp("^" + self.apiname + "\\.(.*)"), _text)) {
            var subcmd = regexpResult[1];
            var arg  = subcmd.split(" ");
            var cmds = arg[0].split(".")
            if (cmds.length === 1) {
                var cmd = cmds[0];

                if (self.api[cmd] !== undefined) {
                    var fnc = self.api[cmd].fnc;
                    if (regexp(new RegExp(self.api[cmd].reg), _text)) {
                        var params = regexpResult;
                        params.shift();
                        fnc.apply(this, params);
                    } else {
                        self.clientOutput("Ошибка разбора параметров.");
                    }

                } else {
                    self.clientOutput("Неизвестный метод '" + cmd + "'");
                }
            } else {
                for (var i = 0; i < self.modules.length && subcmd; i++) {
                    var moduleInfo = self.modules[i];
                    subcmd = moduleInfo.module.parseInput(subcmd);
                }
            }
            return null;
        }
        for (var i = 0; i < self.modules.length && _text; i++) {
            var moduleInfo = self.modules[i];
            _text = moduleInfo.module.parseInput(_text);
        }
        return _text;
    }

    self.parseIncoming = function(_text) {
        for (var i = 0; i < self.modules.length; i++) {
            var moduleInfo = self.modules[i];
            _text = moduleInfo.module.parseIncoming(_text);
        }
        return _text;
    }

    self.onIncoming = function() {
        jmc.event = self.parseIncoming(jmc.event);
    }

    self.onInput = function() {
        jmc.event = self.parseInput(jmc.event);
    }

    if (self.master !== undefined) {
        self.master.addModule(self);
    }

    return self;
}
