litenBotGlobalParser = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модуля
    self.apiname = "парс";
    self.name = "Liten bot: global parser";
    self.version = "1.0";
    self.description = "Глобальный парсер.";

    //  собственные переменные
    self.parseMode = {
        ALWAYS: -1,
        REGULAR: 0,
        ROOM: 1,
        ITEMS: 2,
        MOBS: 3,
        DESCEND: 4,
        MOB: 5
    }

    self.currentRoom = {
        name: "",
        description: "",
        exits: [],
        items: [],
        mobs: [],
        hash: "",
        reset: function() {
            this.name = "";
            this.description = "";
            delete this.exits;
            delete this.items;
            delete this.mobs;
            this.exits = [];
            this.items = [];
            this.mobs = [];
        }
    }

    self.player = {
        hp: 0,
        mn: 0,
        mv: 0,
        exp: 0,
        coin: 0
    }

    self.inFight = false;

    self.currentMob = {
        name: "", level: 0, prof: "", hp: 0, maxhp: 0, mn: 0, maxmn: 0, skills: "",
        reset: function() {
            this.name = ""; this.level = 0; this.prof = ""; this.hp =  0; this.maxhp = 0; this.mn = 0; this.maxmn = 0; this.skills = "";
        }
    }

    self.parsers = [];
    self.transitions = [];
    self.mode = self.parseMode.REGULAR;

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  настройки модуля - дефолтные значения будут заменены сохранёнными
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  вызов родительского конструктора
        parentConstructor();

        //  настройки модуля - всегда в дефолных настройках при старте
        //self.createOption("включен", "нет", "бот включен - да / нет", "string");

        //  регистрация методов api
        ///self.registerApi("доб", /доб (\S+)/, self.add, "добавить новое слово / регулярное выражение / символ в словарь допустимых слов.");

        //  другие методы вызываемые при создании моделя
        //  состояние
        //self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, parseMode.ALWAYS, "Состояние");
        //self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psFightPrompt, false, parseMode.ALWAYS, "СтатусБитвы");
        //self.registerParser(/(.+) R.I.P./, self.psMobRIP, false, self.parseMode.ALWAYS, "РИП");
        //self.registerParser(/сражается с вами!/, self.psFightWithYou, false, self.parseMode.ALWAYS, "СражаетсяСВами");

        //  ошибки
        self.registerParser(/^Не получится! Вы сражаетесь за свою жизнь!/, self.psFightMoveError, false, self.parseMode.ALWAYS, "ОшибкаДвиженияБоя");
        //self.registerParser(/^Кого вы хотите ударить\?/, self.psNoAtackMobError, false, self.parseMode.ALWAYS, "ОшибкаНетМобаАгро");

        var group = "";
        //  room
        group = "Комната";
        //self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;36m(.+)/, self.psRoomName, true, self.parseMode.REGULAR, group);
        self.registerParser(/(.+)/, self.psRoomText, false, self.parseMode.ROOM, group);
        self.registerParser(/^\u001b\[0;36m\[ Exits: (.+) ]/, self.psRoomExits, true, self.parseMode.ROOM, group);
        self.registerParser(/^\u001b\[1;33m(.+)/, self.psItemsStart, true, self.parseMode.DESCEND, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, self.parseMode.ITEMS, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, self.parseMode.DESCEND, group);
        self.registerParser(/(.+)/, self.psMobInRoom, false, self.parseMode.MOBS, group);
        self.registerParser(/(.+)/, self.psItemInRoom, false, self.parseMode.ITEMS, group);

        //  mob
        group = "Моб";
        self.registerParser(/(.+) \[уровень (.+)\], (.+)/, self.psMobName, false, self.parseMode.REGULAR, group);
        self.registerParser(/Хиты: (.+)\/(.+), мана: (.+)\/(.+)/, self.psMobHpMn, false, self.parseMode.MOB, group);
        self.registerParser(/Навыки: (.+)/, self.psMobSkills, false, self.parseMode.MOB, group);

        //  регистрируем сообщения от модуля
        self.master.addMessage(self, "Комната");
        self.master.addMessage(self, "Моб");
        self.master.addMessage(self, "Состояние");
        self.master.addMessage(self, "СтатусБитвы");
        self.master.addMessage(self, "ОшибкаДвиженияБоя");
        self.master.addMessage(self, "ОшибкаНетМобаАгро");
        self.master.addMessage(self, "РИП");
        self.master.addMessage(self, "СражаетсяСВами");

        //  регистрируем события
        self.registerTransition(self.parseMode.DESCEND, self.parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(self.parseMode.MOBS, self.parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(self.parseMode.ITEMS, self.parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(self.parseMode.MOB, self.parseMode.REGULAR, self.transitionMobEnd);
    }

    //  переход от сбора данных о комнате к обычному состоянию
    self.transitionMobEnd = function() {
        self.master.sendMessage("Моб", self.currentMob);
    }
    //  переход от сбора данных о комнате к обычному состоянию
    self.transitionRoomEnd = function() {
        log(gurmStringify(self.currentRoom));
        self.master.sendMessage("Комната", self.currentRoom);
    }

    //  регистрирует пререходы состояний
    self.registerTransition = function(_from, _to, _fnc) {
        if (self.transitions[_from] === undefined) {
            self.transitions[_from] = [];
        }
        self.transitions[_from][_to] = _fnc;
    }

    // изменяет текущий режим парсера, вызывает событие перехода, если таковое присутствует
    self.setMode = function(_newMode) {
        //log(self.mode + " -> " + _newMode);
        if (self.mode !== _newMode) {
            if (self.transitions[self.mode] !== undefined && self.transitions[self.mode][_newMode]) {
                var fnc = self.transitions[self.mode][_newMode];
                fnc();
            }
            self.mode = _newMode;
        }
    }

    //  регистрирует парсеры входящих строк
    self.registerParser = function(_rx, _fnc, _originalText, _atMode, _group) {
        self.parsers.push({
            rx: _rx,
            fnc: _fnc,
            originalText: _originalText === undefined ? false : _originalText,
            atMode: _atMode === undefined ? self.parseMode.ALWAYS : _atMode,
            group: _group === undefined ? "Общее" : _group
        });
    }

    //  parse move error in fight
    self.psNoAtackMobError = function() {
        self.master.sendMessage("ОшибкаНетМобаАгро", true);
    }
    //  parse move error in fight
    self.psFightMoveError = function() {
        self.master.sendMessage("ОшибкаДвиженияБоя", true);
    }
    //  mob self.parsers
    self.psMobName = function(_name) {
        self.setMode(self.parseMode.MOB);
        self.currentMob.reset();
        self.currentMob.name = _name;
    }
    self.psMobHpMn = function(_hp, _maxhp, _mn, _maxmn) {
        self.currentMob.hp = _hp;
        self.currentMob.maxhp = _maxhp;
        self.currentMob.mn = _mn;
        self.currentMob.maxmn = _maxmn;
    }
    self.psMobSkills = function(_skills) {
        self.currentMob.skills = _skills;
        self.setMode(self.parseMode.REGULAR);
    }

    //  room self.parsers
    self.psRoomName = function(_name) {
        self.setMode(self.parseMode.ROOM);
        self.currentRoom.reset();
        self.currentRoom.name = _name;
    }

    self.psRoomText = function(_desc) {
        self.currentRoom.description += _desc;
    }

    self.psItemsStart = function(_text) {
        self.setMode(self.parseMode.ITEMS);
    }

    self.psMobsStart = function(_text) {
        self.setMode(self.parseMode.MOBS);
    }

    self.psMobInRoom = function(_text) {
        _text = _text.split(" (")[0];
        _text = _text.split(" ...")[0];
        _text = _text.trim();
        if (_text !== "") {
            self.currentRoom.mobs.push(_text);
        }
    }

    self.psItemInRoom = function(_text) {
        self.currentRoom.items.push(_text);
    }

    self.psRoomExits = function(_exits) {
        self.setMode(self.parseMode.DESCEND);
        self.currentRoom.exits = _exits.split(" ");
        self.currentRoom.hash = self.currentRoom.description.hash();
    }

    self.psEmpty = function() {
        self.setMode(self.parseMode.REGULAR);
    }

    // устанавливаем статус битвы
    self.setInFight = function(_value) {
        if (self.inFight !== _value) {
            self.inFight = _value;
            self.master.sendMessage("СтатусБитвы", self.inFight);
        }
    }
    //  текст 'сражается с вами'
    self.psFightWithYou = function() {
        self.setInFight(true);
    }
    //  разбор строки состояния боя
    self.psFightPrompt = function(_hp, _mn, _mv, _exp, _meg, coin, _other) {
        self.setInFight(_other.indexOf("[") > -1);
    }
    //  разбор рипа моба
    self.psMobRIP = function(_s) {
        self.master.sendMessage("РИП", true);
    }

    //  разбор строки состояния
    self.psPrompt = function(_hp, _mn, _mv, _exp, _meg, coin, _other) {

        self.setMode(self.parseMode.REGULAR);

        self.player.hp = _hp;
        self.player.mn = _mn;
        self.player.mv = _mv;
        self.player.exp = (_meg === "M" ? _exp * 1000000 : _exp);
        self.player.coin = coin;
        self.master.sendMessage("Состояние", self.player);
    }

    //  обработка входящих сообщений
    self.parseIncoming = function(_text) {
        //log(_text.replace("\u001b", ""));
        _cleartext = removeColor(_text);
        for (var i = 0; i < self.parsers.length; i++) {
            var parseInfo = self.parsers[i];
            if (self.master.listenersCount(parseInfo.group) > 0) {
                //log("in parse");
                var parseText = parseInfo.originalText ? _text : _cleartext;
                if ((parseInfo.atMode === self.parseMode.ALWAYS || parseInfo.atMode === self.mode) && regexp(parseInfo.rx, parseText)) {
                    fnc = parseInfo.fnc;
                    var params = regexpResult;
                    params.shift();
                    fnc.apply(this, params);
                }
            }
        }
        return _text;
    }

    //  вызов констурктор
    //self.constructor()

    return self;
}