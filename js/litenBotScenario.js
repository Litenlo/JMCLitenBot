litenBotScenario = function(_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "��";
    self.name = "Liten bot: scenario";
    self.version = "1.0";
    self.description = "������ ��� �������� ���������.";
    self.author = "������";

    //
    var SC_MODE = {
        READY: 0,
        CREATE: 1
    }

    //  ����������� ����������
    var scenarios = {};
    var mode = SC_MODE.READY;
    var curScenario = undefined;

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  ��������� ������ - ��������� �������� ����� �������� �����������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");
        self.createOption("���_���������", "data/scenario/", "���������� ��� ���������", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����������� ������� api
        self.registerApi("����", /����/, self.list, "�������� ������ ��������� ���������.");
        self.registerApi("����", /���� (\S+)/, self.create, "������ �������� ������ �������� � ��������� ������.");
        self.registerApi("���", /��� (\S+)/, self.select, "������� ��������.");
        self.registerApi("����", /����/, self.stop, "��������� �������� �������� ��������.");
        self.registerApi("�����", /�����/, self.show, "�������� ������� �������� ��������.");
        self.registerApi("����", /���� (\S+)/, self.del, "������� ��������. ������������� �� �������������. ���� �������� �� ���������.");
        self.registerApi("�����", /����� (\S+)/, self.run, "��������� ��������.");

        //  ������ ������ ���������� ��� �������� ������
        self.loadScenarios();
    }

    self.run = function(_name) {
        _name = _name === '' ? curScenario : _name;
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }

        self.clientOutputMobuleTitle();
        self.clientOutputNamed("�������� '" + _name + "' �������.")

        var scenario = scenarios[_name];
        for (var i = 0; i < scenario.length; i++) {
            var cmd = scenario[i];
            self.command(cmd);
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
        }
    }

    self.loadScenario = function(_name) {
        var result = [];
        wd = readObjectFromFile(self.getOption("���_���������") + _name + ".scn");
        for (var ind in wd) {
            result.push(wd[ind]);
        }
        return result;
    }

    self.saveScenario = function(_name) {
        if (scenarios[_name] === undefined) {
            self.clientOutputNamed("�������� '" + _name + "' �� ����������.");
            return;
        }
        writeObjToFile(self.getOption("���_���������") + _name + ".scn", scenarios[_name]);
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
            return;
        }
        self.clientOutputNamed("�������� '" + _name + "' ������.");
        curScenario = _name;
    }

    self.create = function(_name) {
        if (scenarios[_name] !== undefined) {
            self.clientOutputNamed("�������� '" + _name + "' ��� ����������.");
            return;
        }

        scenarios[_name] = [];
        self.select(_name);
        self.clientOutputNamed("�������� '" + _name + "' ������������.");
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

    var parentParseInput = self.parseInput;
    self.parseInput = function(_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        if (mode === SC_MODE.CREATE) {
            self.add(_text);
        }
        return _text;
    }

    //  ����� �����������
    self.constructor()

    return self;
}