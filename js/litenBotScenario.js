litenBotScenario = function(_master) {
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

    //  ����������� ����������
    var scenarios = {};
    var mobs = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;
    var curScenarioPosition = 0;
    var waitTimer = 0;

    var currentRoom = {};

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  ��������� ������ - ��������� �������� ����� �������� �����������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");
        self.createOption("���_���������", "data/scenario/", "���������� ��� ���������", "string");
        self.createOption("��_���", "200", "������������� ������� ����", "string");
        self.createOption("��_�����", "201", "������������� ������� ��� ��������", "string");
        self.createOption("��_���_����", "1", "�������� ���� � ������� ����� �������", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������

        //  ����������� ������� api
        self.registerApi("����", /����/, self.list, "�������� ������ ��������� ���������.");
        self.registerApi("����", /���� (\S+)/, self.create, "������ �������� ������ �������� � ��������� ������.");
        self.registerApi("������", /������/, self.mobCollectStart, "��������� ����� ��������������� ����� ������ � �����.");
        self.registerApi("�����", /�����/, self.mobCollectStop, "��������� ����� ��������������� ����� ������ � �����.");
        self.registerApi("���", /��� (\S+)/, self.select, "������� ��������.");
        self.registerApi("����", /����/, self.stop, "��������� �������� �������� ��������.");
        self.registerApi("�����", /�����/, self.show, "�������� ������� �������� ��������.");
        self.registerApi("����", /���� (\S+)/, self.del, "������� ��������. ������������� �� �������������. ���� �������� �� ���������.");
        self.registerApi("�����", /����� (\S+)/, self.run, "��������� ��������.");

        self.registerApi("��", /�� (\S+)/, self.botWait, "����� � �������� - �������� * ��_���_����.");
        self.registerApi("���", /���/, self.tick, "��� ����.");

        //  ������ � ������
        self.registerApi("����", /���� (.+) == (.+), (.+), (�|�)/, self.addMob, "�������� ������ ����.");
        self.registerApi("���", /��� (.+)/, self.deleteMob, "������� ����.");
        self.registerApi("����", /���� (.+) == (.+), (.+), (�|�)/, self.mobOptions, "��������� ����.");
        self.registerApi("�����", /�����/, self.mobList, "������ ����� ��������� ����.");
        self.registerApi("�����", /�����/, self.clearMobList, "������� ������ ����� ��������� ����.");

        self.registerApi("��", /��/, self.look, "(����� ��� ������������) �������� �������.");

        //  ������ ������ ���������� ��� �������� ������
        self.loadScenarios();

        self.master.parseInput("���.������.������� " + self.getOption("��_���"));
    }

    //  ��������� ����� ��������������� ����� ������ � �����
    self.mobCollectStart = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �����.");
            return;
        }

        self.clientOutputMobuleTitle("������������ ���� ��� �������� '" + curScenario + "'.");

        self.registerReceiver("�������", self.roomReady);
        self.registerReceiver("���", self.mobReady);
    }

    //  ��������� ����� ��������������� ����� ������ � �����
    self.mobCollectStop = function() {
        self.removeReceiver("�������");
        self.removeReceiver("���");

        self.clientOutputMobuleTitle("������ ����� ��� �������� '" + curScenario + "' ���������.");
    }

    //  ��������� ����� �������
    self.roomReady = function(_message, _content) {
        currentRoom = _content;
        var roomMobs = currentRoom.mobs;
        if (roomMobs.length > 0) {
            currentMobIndex = 0;
            newMobArray = [];

            for (var i = 0; i < roomMobs.length; i++) {
                if (mobs[curScenario][roomMobs[i].trim()] === undefined) {
                    jmc.parse("�������� " + (i+2));
                    newMobArray.push(roomMobs[i]);
                }
            }
        }
    }

    //  ��������� ������ ����
    //  todo: ��� ��� ������ ���� ������� �������
    var currentMobIndex = 0;
    var newMobArray = [];
    self.mobReady = function(_message, _content) {
        //  �������, ���� ������ �������� �� ���� ������, ��� �������� (����� ����� ������)
        var parts = _content.name.split("> ");
        _content.name = parts.length === 1 ? _content.name : parts[1];
        /////
        _content.shortName = _content.name.toLowerCase().replace(" ", ".");
        self.clientOutputNamed((currentMobIndex + 1) + " �� " + newMobArray.length + ": " + newMobArray[currentMobIndex] + " => " + _content.shortName);
        self.addMob(newMobArray[currentMobIndex], _content.name, _content.shortName, "�")
        currentMobIndex++;
    }

    //  ��������� ������ ���� � ��������
    self.addMob = function(_disp, _real, _shortName, _option) {
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

    // �������� ��������� ����
    self.mobOptions = function(_disp, _real, _shortName, _option) {
        _disp = _disp.trim();
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� ����.");
            return;
        }
        if (mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ���� '" + _disp + "'.")
            return;
        }
        mobs[curScenario][_disp] = {real: _real, shortName: _shortName, option: _option};
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ������ ��� '" + _disp + "'.")
    }

    //  ������� ���� �� ��������
    self.deleteMob = function(_disp) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� �������� ����.");
            return;
        }
        if (mobs[curScenario][_disp] === undefined) {
            self.clientOutputNamed("� �������� '" + curScenario + "' ��� ��� '" + _disp + "'.")
            return;
        }
        delete mobs[curScenario][_disp];
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ����� ��� '" + _disp + "'.")
    }

    //  ������� ������ ����� ��������� ����
    self.clearMobList = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ������� ������ �����.");
            return;
        }
        delete mobs[curScenario];
        mobs[curScenario] = [];
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ������ ������ �����.")
    }

    self.run = function(_name) {
        _name = _name === '' ? curScenario : _name;
        if (!self.select(_name)) {
            return false;
        }

        mode = SC_MODE.RUN;
        self.clientOutputMobuleTitle();
        self.clientOutputNamed("�������� '" + _name + "' �������.")
        curScenarioPosition = 0;

        self.master.parseInput("���.������.������� " + self.getOption("��_���") + " " + self.getOption("��_���_����") + " ~���.��.���");
    }

    self.tick = function() {
        if (mode === SC_MODE.WAIT) {
            self.clientOutputNamed("�������� '" + curScenario + "' ���: " + waitTimer + ".")
            waitTimer--;
            if (waitTimer === 0) {
                mode = SC_MODE.RUN;
            }
            return;
        }

        var scenario = scenarios[curScenario];
        var cmd = scenario[curScenarioPosition];
        self.clientOutputNamed("�������� '" + curScenario + "' �������: " + cmd + ".")
        self.action(cmd);
        curScenarioPosition++;
        if (curScenarioPosition >= scenario.length) {
            mode = SC_MODE.READY;
            self.master.parseInput("���.������.������� " + self.getOption("��_���"));

            self.clientOutputMobuleTitle();
            self.clientOutputNamed("�������� '" + curScenario + "' ��������.")
        }
    }

    self.command = function(_cmd) {
        self.action(_cmd);
    }

    self.del = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }
        delete scenarios[_name];
        self.saveScenarios();
        self.clientOutputNamed("�������� '" + _name + "' �����.")
    }

    self.saveScenarios = function() {
        var scList = {};
        for (name in scenarios) {
            scList[name] = {};
        }
        writeObjToFile(self.getOption("���_���������") + "scenarios.lst", scList);
    }

    self.loadScenarios = function() {
        scenarios = readObjectFromFile(self.getOption("���_���������") + "scenarios.lst");
        self.clientOutputNamed("�������� ������ ���������");
        for (name in scenarios) {
            scenarios[name] = self.loadScenario(name);
            mobs[name] = self.loadMobs(name);
        }
    }

    //  ��������� ��������
    self.saveScenario = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }
        writeObjToFile(self.getOption("���_���������") + _name + ".scn", scenarios[_name]);
        writeObjToFile(self.getOption("���_���������") + _name + ".mob", mobs[_name]);
    }

    //  ��������� ��������
    self.loadScenario = function(_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("���_���������") + _name + ".scn");
        for (var ind in wd) {
            result.push(wd[ind]);
        }
        return result;
    }

    //  ��������� ����� ��������
    self.loadMobs = function(_name) {
        return readObjectFromFile(self.getOption("���_���������") + _name + ".mob");
    }

    self.list = function() {
        self.clientOutputMobuleTitle();
        self.clientOutput("��������:");
        for (var name in scenarios) {
            self.clientOutput(tab() + (name === curScenario ? "* " : "  ") + name + " (" + scenarios[name].length + ")");
        }
    }

    self.select = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return false;
        }
        self.clientOutputNamed("�������� '" + _name + "' ������.");
        curScenario = _name;
        return true;
    }

    self.create = function(_name) {
        if (scenarios[_name] !== undefined) {
            self.clientOutputNamed("�������� '" + _name + "' ��� ����������.");
            return;
        }

        scenarios[_name] = [];
        mobs[_name] = [];
        self.select(_name);
        self.clientOutputMobuleTitle("�������� '" + _name + "' ������������.");
        mode = SC_MODE.CREATE;

        self.saveScenarios()
    }

    self.stop = function() {
        self.clientOutputNamed("�������� '" + curScenario + "' ��������. �������� � �������� - " + scenarios[curScenario].length + ".");
        mode = SC_MODE.READY;
        curScenario = undefined;
    }

    self.add = function(_command, _pos) {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� �������� ��� ���������� �������.");
            return;
        }

        if (_pos === undefined) {
            scenarios[curScenario].push(_command)
        } else {
            scenarios[curScenario].splice(_pos, 0, _command)
        }
        self.saveScenario(curScenario);
        self.clientOutputNamed("� �������� '" + curScenario + "' ��������� ������� '" + _command + "'.");
    }

    // ������ ����� � ��������
    self.mobList = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� ��������.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("���� � �������� '" + curScenario + "':");
        for (var disp in mobs[curScenario]) {
            var mob = mobs[curScenario][disp];
            self.clientOutput(tab() + "[" + mob.option + "] " + disp + " | " + mob.real  + " | " + mob.shortName);
        }
    }


    self.show = function() {
        if (curScenario === undefined) {
            self.clientOutputNamed("�������� ��������.");
            return;
        }
        self.clientOutputMobuleTitle();
        self.clientOutput("�������� '" + curScenario + "':");
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
        //todo: ���� �� ����� ������� ��� ������ �� ������ �����
        if (curScenario !== undefined) {
            _cleartext = removeColor(_text).trim();
            if (mobs[curScenario][_cleartext] !== undefined) {
                _text = _text + " [" + mobs[curScenario][_cleartext].real + "]";
            }
        }
        return _text;
    }


    //  ����� �����������
    self.constructor()

    return self;
}