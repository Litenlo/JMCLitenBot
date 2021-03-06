litenBotScenario = function (_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "��";
    self.name = "Liten bot: scenario";
    self.version = "1.1";
    self.description = "������ ��� �������� ���������.";
    self.author = "������";

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

    //  ����������� ����������
    var notInstantActionRX = /^(�����|��������|��|�����|��|�����|������|�����|����|�|�|�|�|��|��|~���.��.�� (.+))$/
    var scenarios = {};
    var mobs = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;
    var curScenarioPosition = 0;
    var waitTimer = 0;

    var killMode = KILL_MODE.PASSIVE;
    var mobParseMode = false;

    var inFight = false;
    var onFloor = false;
    var inSilence = false;
    var inBlind = false;
    var isPoisoned = false;
    var isExpDrain = false;
    //var waitForLook = false;
    var inSubAction = false;
    var fightSpellCounter = 0;

    var currentRoom = undefined;

    var __tmpConvertScn = false;

    var curScenStat = {
        startExp: 0,
        startCoin: 0,
        curExp: 0,
        curCoin: 0,
        startTime: Date.now() / 1000 | 0,
        reset: function () {
            this.startExp = 0;
            this.startCoin = 0;
            this.curExp = 0;
            this.curCoin = 0;
            this.startTime = Date.now() / 1000 | 0;
        }
    }
    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function () {
        //  ��������� ������ - ��������� �������� ����� �������� ������������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        self.createOption("���_���������", "data/scenario/", "���������� ��� ���������", "string");
        self.createOption("��_���", "200", "������������� ������� ����", "string");
        self.createOption("��_�����", "201", "������������� ������� ��� ��������", "string");
        self.createOption("��_����", "202", "������������� ������� ��� ��������� ����������", "string");
        self.createOption("����_����", "��;� ���.����;� ���.���;� ���.���;� ���.����;� ���.����;� ���.����", "������ ���������� ��� �����", "string");
        self.createOption("����_����", "��", "�������������� ������������� ����������", "string");
        self.createOption("��_���_����", "1", "�������� ���� � ������� ����� ������� (����������)", "string");
        self.createOption("���_����", "� ���.����", "������� ��� �����", "string");
        self.createOption("���_������", "���", "������� ������", "string");
        self.createOption("���_�����_�����", "�����", "������� ��� ������ �����", "string");
        self.createOption("���_�����_�����", "��� ����.����;�� ��� ���.����", "������� ��� ������ �����", "string");
        self.createOption("���_�����_��", "��� ����.���", "������� ��� ������ ���", "string");
        self.createOption("���_�����_���_����", "�� ����.�� ���;���� ����.��;��� ����.�� ���", "������� ��� ������ ������� ����", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������

        //  ����������� ������� api
        self.registerApi("����", /����/, self.list, "�������� ������ ��������� ���������.");
        self.registerApi("���", /��� (\S+)/, self.select, "������� ��������.");
        self.registerApi("����", /���� (\S+)/, self.create, "������ �������� ������ �������� � ��������� ������.");
        self.registerApi("����", /����/, self.stop, "��������� �������� �������� ��������.");
        self.registerApi("�����", /�����/, self.scnShow, "�������� ������� �������� ��������.");
        self.registerApi("����", /���� (\S+)/, self.del, "������� ��������. ������������� �� �������������. ���� �������� �� ���������.");
        self.registerApi("�����", /����� (\S+)/, self.scnRun, "��������� ��������. ��.����� ��������_��������. ������: ���.��.����� ����� - �������� �������� � ��������� '�����'");
        self.registerApi("����", /���� (\d+)?(.+) == (.+), (.+)/, self.cmdAdd, "�������� ������� � ��������. ���� �����_�_������ ������� == ��������_�������, ���_������� (�����_�_������ - �� ������������, ��������_������� � ���_������� - ����� ���� '���'). ������: ���.��.���� 10 �� ������� == ���, ��� - ������� ������� '�� �������' � �������� �� 10 �������.");
        self.registerApi("�����", /����� (\S+)/, self.cmdDel, "������� ������� �� ��������. ����� �����_�_������. ������: ���.��.����� 10 - ������ �� �������� ������� � ������� 10.");
        self.registerApi("����", /���� (\d+) (.+) == (.+), (.+)/, self.cmdChange, "�������� ������� ��� ����������� �������. ���� �����_�_������ ������� == ��������_�������, ���_�������. ������: ���.��.���� 10 ��� ������� +2 - ������� ������� ��� ������� 10 �� '��� ������� +2'.");
        self.registerApi("����", /����/, self.scnBreak, "��������� ���������� ��������. ������: ���.��.����");
        self.registerApi("����", /����/, self.cmdUndo, "������� ��������� ������� � ������ �������� ��������.");

        self.registerApi("��", /�� (\S+)/, self.botWait, "����� � �������� - �������� * ��_���_����.");
        self.registerApi("���", /���/, self.tick, "��� ����.");
        self.registerApi("��_����_���", /��_����_���/, self.tickFightBot, "��� ����.");


        //  ������ � ������
        self.registerApi("������", /������/, self.mobCollectStart, "��������� ����� ��������������� ����� ������ � �����.");
        self.registerApi("�����", /�����/, self.mobCollectStop, "��������� ����� ��������������� ����� ������ � �����.");
        self.registerApi("����", /���� (.+) == (.+), (.+), (�|�)/, self.addMob, "�������� ������ ����.");
        self.registerApi("���", /��� (.+)/, self.deleteMob, "������� ����.");
        self.registerApi("����", /���� (.+) == (.+), (.+), (�|�)/, self.editMob, "�������������� ���� �� ����� ��� ������ � ������. ���� (��� / ������������ �������� ���� / ����� � ������) == ������_���_����, �����_���_�����, (y - ������ / � - ��������). ������. ���.��.���� 2 == ���� �������, ����, � - ������� ���� � ������� 2.");
        self.registerApi("����", /���� (.+) == (�|�)/, self.mobOptions, "��������� ����. ���� (��� / ������������ �������� ���� / ����� � ������) == (y - ������ / � - ��������). ������: ���.��.���� ��� == � - ��������� ���� ����� � ��������� �������� ����� � (������).");
        self.registerApi("�����", /�����/, self.mobList, "������ ����� ��������� ����.");
        self.registerApi("�����", /�����/, self.clearMobList, "������� ������ ����� ��������� ����.");

        self.registerApi("�����", /����� (0|1|2)/, self.setKillMode, "��������� ������ ������� (0 - ���; 1 - ����� ����; 2 - ����� ������ ����� � ������ ��������� ����).");

        self.registerApi("��", /��/, self.look, "(����� ��� ������������) �������� �������.");

        //  ������ ������ ���������� ��� �������� ������
        self.loadScenarios();

        self.master.parseInput("���.������.������� " + self.getOption("��_���"));

        //  ������������ ��������� �� ������
        self.master.addMessage(self, "����������������");
        self.master.addMessage(self, "����������������");
    }

    //  ��������� �������
    self.cmdStruct = function(_cmd, _roomName, _roomHash) {
        return {
            cmd: _cmd,
            room: {
                name: (_roomName === undefined ? "���" : _roomName) ,
                hash: (_roomHash === undefined ? "���" : _roomHash)
            }
        };
    }

    //  ��������� ������ ����
    self.setKillMode = function (_mode) {
        killMode = _mode;
        self.clientOutputNamed("����� ���� ���������� � �������� '" + _mode + "'.");
    }

    //  ��������� ����� ��������������� ����� ������ � �����
    self.mobCollectStart = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �����.");
            return;
        }

        self.clientOutputMobuleTitle("������������ ���� ��� �������� '" + curScenario + "'.");

        //self.registerReceiver("�������", self.roomReady);
        self.registerReceiver("���", self.mobReady);

        mobParseMode = true;
    }

    //  ��������� ����� ��������������� ����� ������ � �����
    self.mobCollectStop = function () {
        //self.removeReceiver("�������");
        self.removeReceiver("���");

        self.clientOutputMobuleTitle("������ ����� ��� �������� '" + curScenario + "' ���������.");

        mobParseMode = false;
    }

    //  ���������� �������
    self.doLook = function() {
        jmc.parse("��������");
        // if (!waitForLook) {
        //     jmc.parse("��������");
        //     waitForLook = true;
        // }
    }
    //  ������
    self.doStandup = function() {
        if (onFloor) {
            jmc.parse(self.getOption("���_������"));
            onFloor = false;
        }
    }
    //  ����� �����
    self.doSilenceOff = function() {
        if (inSilence) {
            jmc.parse(self.getOption("���_�����_�����"));
            inSilence = false;
        }
    }
    //  ����� �����
    self.doBlindOff = function() {
        if (inBlind) {
            jmc.parse(self.getOption("���_�����_�����"));
            inBlind = false;
        }
    }
    //  ����� ������� ����
    self.doExpDrainOff = function() {
        if (isExpDrain) {
            jmc.parse(self.getOption("���_�����_���_����"));
            isExpDrain = false;
        }
    }
    //  ����� ��
    self.doPoisonOff = function() {
        if (isPoisoned) {
            jmc.parse(self.getOption("���_�����_��"));
            isPoisoned = false;
        }
    }
    //  ��������� ����� �������
    self.roomReady = function (_message, _content) {
        currentRoom = _content;
        var roomMobs = currentRoom.mobs;

        //log(gurmStringify(roomMobs));
        //  �������� ����� (��� ����� �� ��������)
        if (mobParseMode && roomMobs.length > 0) {
            currentMobIndex = 0;
            newMobArray = [];

            for (var i = 0; i < roomMobs.length; i++) {
                if (mobs[curScenario][roomMobs[i].trim()] === undefined) {
                    jmc.parse("�������� " + (i + 2));
                    newMobArray.push(roomMobs[i]);
                    self.addMob(roomMobs[i], "<���������>", "<���������>", "�");
                }
            }
        }

        // if (!waitForLook) {
        //     return;
        // }
        // waitForLook = false;


        //  ��������� ������ "����� ����"
        if (parseInt(killMode) === KILL_MODE.KILLALL) {
            if (roomMobs.length > 0) {
                self.killMob(0);
                return;
            }
        }

        //  ��������� ������ "����� �� ������"
        if (parseInt(killMode) === KILL_MODE.KILLLIST && curScenario !== undefined) {
            for (var i = 0; i < roomMobs.length; i++) {
                var displayMob = roomMobs[i].trim();
                if (mobs[curScenario][displayMob] !== undefined && mobs[curScenario][displayMob].option === "�") {
                    //self.registerReceiver("�����������", self.inFightChange);
                    self.killMob(mobs[curScenario][displayMob].shortName);
                    return;
                }
            }
        }

        if (mode === SC_MODE.RUN && self.canAct()) {
            self.scenarioNextStep();
        }
    }

    //  ��������� �������
    self.statusReady = function (_message, _content) {
        if (curScenStat.startExp === 0) {
            curScenStat.startExp = _content.exp;
            curScenStat.startCoin = _content.coin;
        }
        curScenStat.curExp = _content.exp;
        curScenStat.curCoin = _content.coin;
    }


    //  ��������� ��������� ��������� � �����
    self.inFightChange = function (_message, _content) {
        if (inFight != _content) {
            self.clientOutputNamed("� �����: " + _content);
            inFight = _content;
            if (!inFight) {
                jmc.parse("��������");
                jmc.parse("���");
                self.doLook();
            }
            if (inFight) {
                fightSpellCounter = 0;
            }
        }
    }
    //  ���� �����
    self.charBash = function(_s) {
        if (!onFloor) {
            self.clientOutputNamed("�����");
            onFloor = true;
            self.doStandup();
        }
    }
    //  ���� ���������
    self.charSilence = function() {
        if (!inSilence) {
            self.clientOutputNamed("�����");
            inSilence = true;
            self.doSilenceOff();
        }
    }
    //  ���� ���������
    self.charBlind = function() {
        if (!inBlind) {
            self.clientOutputNamed("�����");
            inBlind = true;
            //waitForLook = false;
            self.doBlindOff();
            self.doLook();
        }
    }
    //  � ���� ������ ����
    self.charExpDrain = function() {
        if (!isExpDrain) {
            self.clientOutputNamed("������ ����");
            isExpDrain = true;
            self.doExpDrainOff();
        }
    }
    //  ���� ���������
    self.charPoison = function() {
        if (!isPoisoned) {
            self.clientOutputNamed("��");
            isPoisoned = true;
            self.doPoisonOff();
        }
    }
    //  ��������� ���� � �������
    self.someoneRIP = function(_s) {
        //self.doLook();
        self.inFightChange("none", true);
    }

    self.killMob = function (_name) {
        if (typeof (_name) === "number") {
            _name = _name + 2;
        }
        self.clientOutputNamed("������ ���� '" + _name + "'");

        //self.inFightChange("none", true);

        jmc.parse(self.getOption("���_����") + " " + (_name));
    }

    //  ��������� ������ ����
    //  todo: ��� ��� ������ ���� ������� �������
    var currentMobIndex = 0;
    var newMobArray = [];
    self.mobReady = function (_message, _content) {
        //  �������, ���� ������ �������� �� ���� ������, ��� �������� (����� ����� ������)
        var parts = _content.name.split("> ");
        _content.name = parts.length === 1 ? _content.name : parts[1];
        /////
        _content.shortName = _content.name.toLowerCase().replace(/\s/g, ".");
        self.clientOutputNamed((currentMobIndex + 1) + " �� " + newMobArray.length + ": " + newMobArray[currentMobIndex] + " => " + _content.shortName);
        self.editMob(newMobArray[currentMobIndex], _content.name, _content.shortName, "�")
        currentMobIndex++;
    }

    //  ��������� ������ ���� � ��������
    self.addMob = function (_disp, _real, _shortName, _option) {
        _disp = _disp.trim();
        _real = _real.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� ����.");
            return;
        }
        if (mobs[curScenario][_disp] !== undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ���� ��� '" + _disp + "'.")
            return;
        }
        mobs[curScenario][_disp] = {real: _real, shortName: _shortName, option: _option};
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' �������� ��� '" + _disp + "'.")
    }

    // �������� ����
    self.editMob = function (_disp, _real, _shortName, _option) {
        _disp = _disp.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� ����.");
            return;
        }
        if ((isNaN(Number(_disp)) || Number(_disp) > mobs[curScenario].length) && mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ���� '" + _disp + "'.")
            return;
        }

        _disp = self.mobGetName(_disp);

        mobs[curScenario][_disp] = {real: _real, shortName: _shortName, option: _option};
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ������� ��� '" + _disp + "'.")
    }
    //  �������� ���������� ��� ���� �� �������
    self.mobGetName = function(_disp) {
        if (!isNaN(Number(_disp))) {
            var mobIndex = Number(_disp);
            var counter = 1;
            for (var _key in mobs[curScenario]) {
                if (counter === mobIndex) {
                    return _key;
                }
                counter++;
            }
        }
        return _disp;
    }

    //  ��������� ��������� ����
    self.mobOptions = function (_disp, _option) {
        _disp = _disp.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� ����.");
            return;
        }

        if ((isNaN(Number(_disp)) || Number(_disp) > mobs[curScenario].length) && _disp !== "���" && mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ���� '" + _disp + "'.")
            return;
        }

        _disp = self.mobGetName(_disp);

        if (_disp === "���") {
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
        self.clientOutputNamed("� �������� '" + curScenario + "' ������� ��� '" + _disp + "' ����� '" + _option + "'.")
    }

    //  ������� ���� �� ��������
    self.deleteMob = function (_disp) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� �������� ����.");
            return;
        }
        if ((isNaN(Number(_disp)) || Number(_disp) > mobs[curScenario].length) && mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ��� '" + _disp + "'.")
            return;
        }

        _disp = self.mobGetName(_disp);

        delete mobs[curScenario][_disp];
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ����� ��� '" + _disp + "'.")
    }

    //  ������� ������ ����� ��������� ����
    self.clearMobList = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ������� ������ �����.");
            return;
        }
        delete mobs[curScenario];
        mobs[curScenario] = [];
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ������ ������ �����.")
    }

    self.scnRun = function (_name) {
        _name = _name === '' ? curScenario : _name;
        if (!self.select(_name)) {
            return false;
        }

        mode = SC_MODE.RUN;
        self.clientOutputMobuleTitle();
        self.clientOutputNamed("�������� '" + _name + "' �������.")
        curScenarioPosition = 0;
        curScenStat.reset();


        self.registerReceiver("�������", self.roomReady);
        self.registerReceiver("���������", self.statusReady);
        //self.registerReceiver("�����������������", self.scenarioRollBackStep);
        self.registerReceiver("�����������", self.inFightChange);
        self.registerReceiver("�����������������", self.doLook);
        self.registerReceiver("���", self.someoneRIP);
        self.registerReceiver("��������������", self.inFightChange);
        self.registerReceiver("����.���", self.charBash);
        self.registerReceiver("����.��������", self.charSilence);
        self.registerReceiver("����.����", self.charBlind);
        self.registerReceiver("����.��", self.charPoison);
        self.registerReceiver("����.���.����", self.charExpDrain);

        if (self.canAct()) {
            self.scenarioNextStep();
        }

        self.master.parseInput("���.������.������� " + self.getOption("��_���") + " " + self.getOption("��_���_����") + " ~���.��.���");
        self.master.parseInput("���.������.������� " + self.getOption("��_����") + " 25 ~���.��.��_����_���");
    }

    self.tick = function () {
        if (mode === SC_MODE.WAIT) {
            self.clientOutputNamed("�������� '" + curScenario + "' ���: " + waitTimer + ".")
            waitTimer--;
            if (waitTimer === 0) {
                mode = SC_MODE.RUN;
                self.scenarioNextStep()
            }
            return;
        }
    }

    self.tickFightBot = function() {
        if (mode == SC_MODE.RUN && inFight && self.getOption("����_����") === "��") {
            var spells = self.getOption("����_����").split(";");
            fightSpellCounter++;
            fightSpellCounter = fightSpellCounter > spells.length ? 2 : fightSpellCounter;
            self.action("" + spells[fightSpellCounter - 1]);
        }
    }

    self.scenarioRollBackStep = function() {
        curScenarioPosition--;
        var scenario = scenarios[curScenario];
        var cmd = scenario[curScenarioPosition];
        self.clientOutputNamed("�������� '" + curScenario + "' ������� �� �������: " + cmd + ".")
    }

    self.scenarioNextStep = function () {
        var scenario = scenarios[curScenario];

        var commandInfo = scenario[curScenarioPosition];
        var cmd = commandInfo.cmd;
        var roomCmd = false;

        while (!roomCmd && curScenarioPosition < scenario.length && (commandInfo.room.hash === "���" || (currentRoom !== undefined && (commandInfo.room.hash === currentRoom.hash || __tmpConvertScn)))) {

            if (__tmpConvertScn && currentRoom !== undefined) {
                scenarios[curScenario][curScenarioPosition].room.name = currentRoom.name;
                scenarios[curScenario][curScenarioPosition].room.hash = currentRoom.hash;
            }

            if (self.master.listenersCount("����������������") > 0) {
                self.master.sendMessage("����������������", {
                    cmd: cmd,
                    position: curScenarioPosition
                });
            }

            self.clientOutputNamed("�������� '" + curScenario + "' �������: [" + (curScenarioPosition + 1) + " / " + scenario.length + "] " + cmd + ".")
            self.action(cmd);

            roomCmd = !self.instantAction(cmd);

            curScenarioPosition++;

            if (curScenarioPosition < scenario.length) {
                commandInfo = scenario[curScenarioPosition];
                cmd = commandInfo.cmd;
            }
        }
        //waitForLook = true;

        if (curScenarioPosition >= scenario.length) {
            self.scnFinish();
        }
    }

    //  ��������� ���������� ��������
    self.scnFinish = function() {
        self.scnClose();

        self.clientOutputMobuleTitle();
        self.clientOutputNamed("�������� '" + curScenario + "' ��������.");
        var secTime = ((Date.now() / 1000 | 0) - curScenStat.startTime);
        self.clientOutputNamed("�����: " + secTime + " ���.");
        self.clientOutputNamed("����: " + numberWithSpaces(curScenStat.startExp - curScenStat.curExp) + ", " + ((curScenStat.startExp - curScenStat.curExp) / secTime | 0) + " � �������");
        self.clientOutputNamed("�����: " + numberWithSpaces(curScenStat.curCoin - curScenStat.startCoin) + ", " + ((curScenStat.curCoin - curScenStat.startCoin) / secTime | 0) + " � �������");

        if (self.master.listenersCount("����������������") > 0) {
            self.master.sendMessage("����������������", {
                name: curScenario,
                time: secTime,
                coin: curScenStat.curCoin - curScenStat.startCoin,
                exp: curScenStat.startExp - curScenStat.curExp
            });
        }
    }
    //  �������� ���������� ��������
    self.scnBreak = function() {
        self.scnClose();

        self.clientOutputMobuleTitle();
        self.clientOutputNamed("�������� '" + curScenario + "' �������.");
        var secTime = ((Date.now() / 1000 | 0) - curScenStat.startTime);
        self.clientOutputNamed("�����: " + secTime + " ���.");
        self.clientOutputNamed("����: " + numberWithSpaces(curScenStat.startExp - curScenStat.curExp) + ", " + ((curScenStat.startExp - curScenStat.curExp) / secTime | 0) + " � �������");
        self.clientOutputNamed("�����: " + numberWithSpaces(curScenStat.curCoin - curScenStat.startCoin) + ", " + ((curScenStat.curCoin - curScenStat.startCoin) / secTime | 0) + " � �������");
    }
    // ����������� ������ �� ���������
    self.scnClose = function() {
        mode = SC_MODE.READY;
        self.removeReceiver("�������");
        self.removeReceiver("���������");
        self.removeReceiver("�����������");
        //self.removeReceiver("�����������������");
        self.removeReceiver("�����������������");
        self.removeReceiver("���");
        self.removeReceiver("��������������");
        self.removeReceiver("����.���");
        self.removeReceiver("����.��������");
        self.removeReceiver("����.����");
        self.removeReceiver("����.��");
        self.removeReceiver("����.���.����");

        self.master.parseInput("���.������.������� " + self.getOption("��_���"));
        self.master.parseInput("���.������.������� " + self.getOption("��_����"));
    }

    //  ������� �� ������� ��������� �����
    self.instantAction = function(_action) {
        //log(!regexp(notInstantActionRX, _action));
        return !(regexp(notInstantActionRX, _action) || _action.charAt(0) === "'");
    }

    self.canAct = function () {
        return !inFight && !inSubAction && !inBlind;
    }

    self.command = function (_cmd) {
        self.action(_cmd);
    }

    self.del = function (_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }
        delete scenarios[_name];
        self.saveScenarios();
        self.clientOutputNamed("�������� '" + _name + "' �����.")
    }

    self.saveScenarios = function () {
        var scList = {};
        for (name in scenarios) {
            scList[name] = {};
        }
        writeObjToFile(self.getOption("���_���������") + "scenarios.lst", scList);
    }

    self.loadScenarios = function () {
        scenarios = readObjectFromFile(self.getOption("���_���������") + "scenarios.lst");
        self.clientOutputNamed("�������� ������ ���������");
        for (name in scenarios) {
            scenarios[name] = self.loadScenario(name);
            mobs[name] = self.loadMobs(name);
        }
    }

    //  ��������� ��������
    self.saveScenario = function (_name, _fileName) {
        _fileName = (_fileName === undefined ? _name : _fileName);
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }
        writeObjToFile(self.getOption("���_���������") + _fileName + ".scn", scenarios[_name]);
        writeObjToFile(self.getOption("���_���������") + _fileName + ".mob", mobs[_name]);
    }

    //  ��������� ��������
    self.loadScenario = function (_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("���_���������") + _name + ".scn");
        for (var ind in wd) {
            var cmd = wd[ind];
            if (typeof cmd === "string") {
                cmd = self.cmdStruct(cmd, undefined, undefined);
            }
            result.push(cmd);
        }
        return result;
    }

    //  ��������� ����� ��������
    self.loadMobs = function (_name) {
        return readObjectFromFile(self.getOption("���_���������") + _name + ".mob");
    }

    self.list = function () {
        self.clientOutputMobuleTitle();
        self.clientOutput("��������:");
        for (var name in scenarios) {
            self.clientOutput(tab() + (name === curScenario ? "* " : "  ") + name + " (" + scenarios[name].length + ")");
        }
    }

    self.select = function (_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return false;
        }
        self.clientOutputNamed("�������� '" + _name + "' ������.");
        curScenario = _name;
        return true;
    }

    self.create = function (_name) {
        if (scenarios[_name] !== undefined) {
            self.clientOutputNamed("�������� '" + _name + "' ��� ����������.");
            return;
        }

        self.registerReceiver("�������", self.roomReady);

        currentRoom = undefined;

        scenarios[_name] = [];
        mobs[_name] = [];
        self.select(_name);
        self.clientOutputMobuleTitle("�������� '" + _name + "' ������������.");
        mode = SC_MODE.CREATE;

        self.saveScenarios();

        self.doLook();
        self.cmdAdd("", "��������", "���", "���");
    }

    self.stop = function () {
        self.clientOutputNamed("�������� '" + curScenario + "' ��������. �������� � �������� - " + scenarios[curScenario].length + ".");
        self.removeReceiver("�������");

        mode = SC_MODE.READY;
        curScenario = undefined;
    }


    self.cmdAdd = function (_pos, _command, _roomName, _roomHash) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �������.");
            return;
        }

        _command = _command.trim();
        _command = self.cmdStruct(_command, _roomName, _roomHash);

        if (_pos === "") {
            scenarios[curScenario].push(_command)
        } else {
            scenarios[curScenario].splice(_pos - 1, 0, _command)
        }
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ��������� ������� '" + _command.cmd + "'.");
    }

    //  �������� ������� ��� �������
    self.cmdChange = function(_pos, _command, _roomName, _roomHash) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �������.");
            return;
        }

        _pos = Number(_pos) - 1;

        var _oldCommand = scenarios[curScenario][_pos];
        _command = _command.trim();
        _command = self.cmdStruct(_command, _roomName, _roomHash);
        scenarios[curScenario][_pos] = _command;

        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' �������� ������� [" + (_pos + 1) + "] '" + _oldCommand.cmd + "' �� '" + _command.cmd + "'.");
    }

    //  ������� ������� �� ��������
    self.cmdDel = function(_pos) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �������.");
            return;
        }

        if (_pos > scenarios[curScenario].length) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ������� � ������� '" + _pos + "'.");
            return;
        }
        var cmd = scenarios[curScenario][_pos - 1];
        scenarios[curScenario].splice(_pos - 1, 1);
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ������� ������� � ������� '" + _pos + "' ('" + cmd.cmd + "').");
    }

    // ������ ����� � ��������
    self.mobList = function () {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� ��������.");
            return;
        }
        var delimiter = "  ";
        self.clientOutputMobuleTitle();
        self.clientOutput("���� � �������� '" + curScenario + "':");
        self.clientOutput(tab()
            + "�".padStart(3) + delimiter
            + "� ����".toString().padEnd(50) + delimiter
            + "���".toString().padEnd(20) + delimiter
            + "�����".toString().padEnd(20) + delimiter
            + "���".toString().padStart(4)
        );
        var counter = 0;
        for (var disp in mobs[curScenario]) {
            counter++;
            var mob = mobs[curScenario][disp];

            self.clientOutput(tab()
                + (counter).toString().padStart(3) + delimiter
                + disp.toString().padEnd(50) + delimiter
                + mob.real.toString().padEnd(20) + delimiter
                + mob.shortName.toString().padEnd(20) + delimiter
                + mob.option.toString().padStart(3)
            );

            //self.clientOutput(tab() + (counter).toString().padStart(3) + ". [" + mob.option + "] " + disp + " | " + mob.real + " | " + mob.shortName);
        }
    }


    self.scnShow = function () {
        var comInLine = 5;
        var comLen = 20;
        var comPre = 3;

        if (curScenario === undefined) {
            self.clientOutputNamed("�������� ��������.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("�������� '" + curScenario + "':");
        // var counter = 0;
        // var str = "";
        // for (var i = 0; i < scenarios[curScenario].length; i++) {
        //
        //     str = str + ((i + 1).toString().padStart(comPre) + ". " + scenarios[curScenario][i].cmd).padEnd(comLen);
        //     counter++;
        //     if (counter === comInLine || i + 1 === scenarios[curScenario].length) {
        //         self.clientOutput(tab() + str);
        //         str = "";
        //         counter = 0;
        //     }
        // }

        var delimiter = "  ";

        self.clientOutput(tab()
            + "�".padStart(3) + delimiter
            + "�������".toString().padEnd(50) + delimiter
            + "�������".toString().padEnd(40) + delimiter
            + "�����".toString().padEnd(10)
        );
        var counter = 0;
        for (var i = 0; i < scenarios[curScenario].length; i++) {
            counter++;
            var cmdInfo = scenarios[curScenario][i];

            self.clientOutput(tab()
                + (counter).toString().padStart(3) + delimiter
                + cmdInfo.cmd.toString().padEnd(50) + delimiter
                + cmdInfo.room.name.padEnd(40) + delimiter
                + cmdInfo.room.hash.padEnd(10)
            );

            //self.clientOutput(tab() + (counter).toString().padStart(3) + ". [" + mob.option + "] " + disp + " | " + mob.real + " | " + mob.shortName);
        }

    }
    //  bot command section
    self.botWait = function (_time) {
        mode = SC_MODE.WAIT;
        waitTimer = parseInt(_time);
    }

    //  ������� ��������� ������� � ������ �������� ��������
    self.cmdUndo = function() {
        if (mode !== SC_MODE.CREATE) {
            self.clientOutputNamed("�� ������ ���� � ������ �������� ��������.");
            return;
        }
        self.cmdDel(scenarios[curScenario].length);
    }

    var parentParseInput = self.parseInput;
    self.parseInput = function (_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        if (mode === SC_MODE.CREATE) {
            self.cmdAdd("", _text, currentRoom === undefined ? undefined : currentRoom.name, currentRoom === undefined ? undefined : currentRoom.hash);
            if (_text.charAt(0) === "~") {
                _text = "";
            }
        }
        return _text;
    }

    self.parseIncoming = function (_text) {
        //todo: ���� �� ����� ������� ��� ������ �� ������ �����
        // if (curScenario !== undefined) {
        //     _cleartext = removeColor(_text).trim();
        //     if (mobs[curScenario][_cleartext] !== undefined) {
        //         _text = _text + " [" + mobs[curScenario][_cleartext].shortName + "]";
        //     }
        // }
        return _text;
    }


    //  ����� �����������
    self.constructor()

    return self;
}