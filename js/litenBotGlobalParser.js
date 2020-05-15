litenBotGlobalParser = function(_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "����";
    self.name = "Liten bot: global parser";
    self.version = "1.0";
    self.description = "���������� ������.";

    //  ����������� ����������
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

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  ��������� ������ - ��������� �������� ����� �������� �����������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����������� ������� api
        ///self.registerApi("���", /��� (\S+)/, self.add, "�������� ����� ����� / ���������� ��������� / ������ � ������� ���������� ����.");

        //  ������ ������ ���������� ��� �������� ������
        //  ���������
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psPrompt, false, parseMode.ALWAYS, "���������");
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psFightPrompt, false, parseMode.ALWAYS, "�����������");
        self.registerParser(/(.+) R.I.P./, self.psMobRIP, false, parseMode.ALWAYS, "���");
        self.registerParser(/��������� � ����!/, self.psFightWithYou, false, parseMode.ALWAYS, "��������������");

        //  ������
        self.registerParser(/^�� ���������! �� ���������� �� ���� �����!/, self.psFightMoveError, false, parseMode.ALWAYS, "�����������������");
        self.registerParser(/^���� �� ������ �������\?/, self.psNoAtackMobError, false, parseMode.ALWAYS, "�����������������");

        var group = "";
        //  room
        group = "�������";
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psPrompt, false, parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;36m(.+)/, self.psRoomName, true, parseMode.REGULAR, group);
        self.registerParser(/(.+)/, self.psRoomText, false, parseMode.ROOM, group);
        self.registerParser(/^\u001b\[0;36m\[ Exits: (.+) ]/, self.psRoomExits, true, parseMode.ROOM, group);
        self.registerParser(/^\u001b\[1;33m(.+)/, self.psItemsStart, true, parseMode.DESCEND, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, parseMode.ITEMS, group);
        self.registerParser(/^\u001b\[1;31m(.+)/, self.psMobsStart, true, parseMode.DESCEND, group);
        self.registerParser(/(.+)/, self.psMobInRoom, false, parseMode.MOBS, group);
        self.registerParser(/(.+)/, self.psItemInRoom, false, parseMode.ITEMS, group);

        //  mob
        group = "���";
        self.registerParser(/(.+) \[������� (.+)\], (.+)/, self.psMobName, false, parseMode.REGULAR, group);
        self.registerParser(/����: (.+)\/(.+), ����: (.+)\/(.+)/, self.psMobHpMn, false, parseMode.MOB, group);
        self.registerParser(/������: (.+)/, self.psMobSkills, false, parseMode.MOB, group);

        //  ������������ ��������� �� ������
        self.master.addMessage(self, "�������");
        self.master.addMessage(self, "���");
        self.master.addMessage(self, "���������");
        self.master.addMessage(self, "�����������");
        self.master.addMessage(self, "�����������������");
        self.master.addMessage(self, "�����������������");
        self.master.addMessage(self, "���");
        self.master.addMessage(self, "��������������");

        //  ������������ �������
        self.registerTransition(parseMode.DESCEND, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.MOBS, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.ITEMS, parseMode.REGULAR, self.transitionRoomEnd);
        self.registerTransition(parseMode.MOB, parseMode.REGULAR, self.transitionMobEnd);
    }

    //  ������� �� ����� ������ � ������� � �������� ���������
    self.transitionMobEnd = function() {
        self.master.sendMessage("���", currentMob);
    }
    //  ������� �� ����� ������ � ������� � �������� ���������
    self.transitionRoomEnd = function() {
        self.master.sendMessage("�������", currentRoom);
    }

    //  ������������ ��������� ���������
    self.registerTransition = function(_from, _to, _fnc) {
        if (transitions[_from] === undefined) {
            transitions[_from] = [];
        }
        transitions[_from][_to] = _fnc;
    }

    // �������� ������� ����� �������, �������� ������� ��������, ���� ������� ������������
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

    //  ������������ ������� �������� �����
    self.registerParser = function(_rx, _fnc, _originalText, _atMode, _group) {
        parsers.push({
            rx: _rx,
            fnc: _fnc,
            originalText: _originalText === undefined ? false : _originalText,
            atMode: _atMode === undefined ? parseMode.ALWAYS : _atMode,
            group: _group === undefined ? "�����" : _group
        });
    }

    //  parse move error in fight
    self.psNoAtackMobError = function() {
        self.master.sendMessage("�����������������", true);
    }
    //  parse move error in fight
    self.psFightMoveError = function() {
        self.master.sendMessage("�����������������", true);
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

    // ������������� ������ �����
    self.setInFight = function(_value) {
        if (inFight !== _value) {
            inFight = _value;
            self.master.sendMessage("�����������", inFight);
        }
    }
    //  ����� '��������� � ����'
    self.psFightWithYou = function() {
        self.setInFight(true);
    }
    //  ������ ������ ��������� ���
    self.psFightPrompt = function(_hp, _mn, _mv, _exp, _meg, coin, _other) {
        self.setInFight(_other.indexOf("[") > -1);
    }
    //  ������ ���� ����
    self.psMobRIP = function(_s) {
        self.master.sendMessage("���", true);
    }

    //  ������ ������ ���������
    self.psPrompt = function(_hp, _mn, _mv, _exp, _meg, coin, _other) {
        self.setMode(parseMode.REGULAR);

        player.hp = _hp;
        player.mn = _mn;
        player.mv = _mv;
        player.exp = (_meg === "M" ? _exp * 1000 : _exp);
        player.coin = coin;
        self.master.sendMessage("���������", player);
    }

    //  ��������� �������� ���������
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

    //  ����� �����������
    self.constructor()

    return self;
}