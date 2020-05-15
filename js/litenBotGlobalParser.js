litenBotGlobalParser = function(_master) {
    var self = new absModule(_master);

    //  родительские переменные модуля
    self.apiname = "парс";
    self.name = "Liten bot: global parser";
    self.version = "1.0";
    self.description = "Глобальный парсер.";

    //  собственные переменные
    var parseMode = {
        ALWAYS: -1,
        REGULAR: 0,
        ROOM: 1,
        ITEMS: 2,
        MOBS: 3,
        DESCEND: 4,
        MOB: 5
    }

    var currentRoom = {
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

    var player = {
        hp: 0,
        mn: 0,
        mv: 0,
        exp: 0,
        coin: 0
    }

    var inFight = false;

    var currentMob = {
        name: "", level: 0, prof: "", hp: 0, maxhp: 0, mn: 0, maxmn: 0, skills: "",
        reset: function() {
            this.name = ""; this.level = 0; this.prof = ""; this.hp =  0; this.maxhp = 0; this.mn = 0; this.maxmn = 0; this.skills = "";
        }
    }

    var parsers = [];
    var transitions = [];
    var mode = parseMode.REGULAR;

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
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, parseMode.ALWAYS, "Состояние");
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psFightPrompt, false, parseMode.ALWAYS, "СтатусБитвы");
        self.registerParser(/(.+) R.I.P./, self.psMobRIP, false, parseMode.ALWAYS, "РИП");
        self.registerParser(/сражается с вами!/, self.psFightWithYou, false, parseMode.ALWAYS, "СражаетсяСВами");

        //  ошибки
        self.registerParser(/^Не получится! Вы сражаетесь за свою жизнь!/, self.psFightMoveError, false, parseMode.ALWAYS, "ОшибкаДвиженияБоя");
        self.registerParser(/^Кого вы хотите ударить\?/, self.psNoAtackMobError, false, parseMode.ALWAYS, "ОшибкаНетМобаАгро");

        var group = "";
        //  room
        group = "Комната";
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;36m(.+)/, self.psRoomName, true, parseMode.REGULAR, group);
        self.registerParser(/(.+)/, self.psRoomText, false, parseMode.ROOM, group);
        self.registerParser(/^\u001b\[0;36m\[ Exits: (.+) ]/, self.psRoomExits, true, parseMode.ROOM, group);
        self.registerParser(/^\u001b\[1;33m(.+)/, self.psItemsStart, true, parseMode.DESCEND, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, parseMode.ITEMS, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, parseMode.DESCEND, group);
        self.registerParser(/(.+)/, self.psMobInRoom, false, parseMode.MOBS, group);
        self.registerParser(/(.+)/, self.psItemInRoom, false, parseMode.ITEMS, group);

        //  mob
        group = "Моб";
        self.registerParser(/(.+) \[уровень (.+)\], (.+)/, self.psMobName, false, parseMode.REGULAR, group);
        self.registerParser(/Хиты: (.+)\/(.+), мана: (.+)\/(.+)/, self.psMobHpMn, false, parseMode.MOB, group);
        self.registerParser(/Навыки: (.+)/, self.psMobSkills, false, parseMode.MOB, group);

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
        self.registerTransition(parseMode.DESCEND, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.MOBS, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.ITEMS, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.MOB, parseMode.REGULAR, self.transitionMobEnd);
    }

    //  переход от сбора данных о комнате к обычному состоянию
    self.transitionMobEnd = function() {
        self.master.sendMessage("Моб", currentMob);
    }
    //  переход от сбора данных о комнате к обычному состоянию
    self.transitionRoomEnd = function() {
        self.master.sendMessage("Комната", currentRoom);
    }

    //  регистрирует пререходы состояний
    self.registerTransition = function(_from, _to, _fnc) {
        if (transitions[_from] === undefined) {
            transitions[_from] = [];
        }
        transitions[_from][_to] = _fnc;
    }

    // изменяет текущий режим парсера, вызывает событие перехода, если таковое присутствует
    self.setMode = function(_newMode) {
        //log(mode + " -> " + _newMode);
        if (mode !== _newMode) {
            if (transitions[mode] !== undefined && transitions[mode][_newMode]) {
                var fnc = transitions[mode][_newMode];
                fnc();
            }
            mode = _newMode;
        }
    }

    //  регистрирует парсеры входящих строк
    self.registerParser = function(_rx, _fnc, _originalText, _atMode, _group) {
        parsers.push({
            rx: _rx,
            fnc: _fnc,
            originalText: _originalText === undefined ? false : _originalText,
            atMode: _atMode === undefined ? parseMode.ALWAYS : _atMode,
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
    //  mob parsers
    self.psMobName = function(_name) {
        self.setMode(parseMode.MOB);
        currentMob.reset();
        currentMob.name = _name;
    }
    self.psMobHpMn = function(_hp, _maxhp, _mn, _maxmn) {
        currentMob.hp = _hp;
        currentMob.maxhp = _maxhp;
        currentMob.mn = _mn;
        currentMob.maxmn = _maxmn;
    }
    self.psMobSkills = function(_skills) {
        currentMob.skills = _skills;
        self.setMode(parseMode.REGULAR);
    }

    //  room parsers
    self.psRoomName = function(_name) {
        self.setMode(parseMode.ROOM);
        currentRoom.reset();
        currentRoom.name = _name;
    }

    self.psRoomText = function(_desc) {
        currentRoom.description += _desc;
    }

    self.psItemsStart = function(_text) {
        self.setMode(parseMode.ITEMS);
    }

    self.psMobsStart = function(_text) {
        self.setMode(parseMode.MOBS);
    }

    self.psMobInRoom = function(_text) {
        currentRoom.mobs.push(_text);
    }

    self.psItemInRoom = function(_text) {
        currentRoom.items.push(_text);
    }

    self.psRoomExits = function(_exits) {
        self.setMode(parseMode.DESCEND);
        currentRoom.exits = _exits.split(" ");
        currentRoom.hash = currentRoom.description.hash();
    }

    self.psEmpty = function() {
        self.setMode(parseMode.REGULAR);
    }

    // устанавливаем статус битвы
    self.setInFight = function(_value) {
        if (inFight !== _value) {
            inFight = _value;
            self.master.sendMessage("СтатусБитвы", inFight);
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
        self.setMode(parseMode.REGULAR);

        player.hp = _hp;
        player.mn = _mn;
        player.mv = _mv;
        player.exp = (_meg === "M" ? _exp * 1000 : _exp);
        player.coin = coin;
        self.master.sendMessage("Состояние", player);
    }

    //  обработка входящих сообщений
    self.parseIncoming = function(_text) {
        //log(_text.replace("\u001b", ""));
        _cleartext = removeColor(_text);
        for (var i = 0; i < parsers.length; i++) {
            var parseInfo = parsers[i];
            if (self.master.listenersCount(parseInfo.group) > 0) {
                //log("in parse");
                var parseText = parseInfo.originalText ? _text : _cleartext;
                if ((parseInfo.atMode === parseMode.ALWAYS || parseInfo.atMode === mode) && regexp(parseInfo.rx, parseText)) {
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
    self.constructor()

    return self;
}