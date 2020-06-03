litenBotScenarioComposer = function (_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "��";
    self.name = "Liten bot: scenario composer";
    self.version = "1.0";
    self.description = "������������ ���������.";
    self.author = "������";

    var SC_MODE = {
        NONE: 0,
        RUN: 1,
        IDLE: 2
    }

    //  ������ �� �������� ��������
    self.scnName = undefined;
    self.cmdCounter = 0;
    self.idleCounter = 0;


    //  ����������� ����������
    self.mode = SC_MODE.NONE;
    self.setMode = function (_v) {
        self.clientOutputNamed("mode " + self.mode + " -> " + _v + ".");
        self.mode = _v;
    }
    self.scnList = [];

    //  ����������
    self.stat = {
        runTimer: 0,
        idleTimer: 0
    }

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function () {
        //  ��������� ������ - ��������� �������� ����� �������� �����������
        self.createOption("����_�������������", "data/default.orh", "���� �������������", "string");
        self.createOption("����_����������_�������������", "data/stat.orh", "���� �������������", "string");
        self.createOption("��_��", "300", "������������� ������� �������������", "string");
        self.createOption("��_��������", "�������", "�������� ��������", "string");
        self.createOption("����_����", "3", "����� ������� � ������� ��� ������� �������� �����������", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����������� ������� api
        self.registerApi("���", /��� (.+) (\d+)/, self.scnAdd, "��������� ��������.");
        self.registerApi("��", /�� (.+)/, self.scnDel, "������� ��������.");
        self.registerApi("�����", /�����/, self.scnShow, "���������� ������ ���������.");
        self.registerApi("������", /������ (.+)/, self.resetTimer, "���������� ������� ���� ��� ����. ������: ���.��.������ ��� - ������� ������ ���� ���, ���.��.������ ��� - ������� ������ ���� '�����'");
        self.registerApi("������", /������/, self.resetStat, "���������� ����������.");
        self.registerApi("������", /������ (.+)/, self.switchEnabled, "�������� ������ ��������. ������: ���.��.������ ����� - ������� ������ �������� '�����' �� ��������������� ��������.");
        self.registerApi("�����", /�����/, self.start, "��������� ���������� ���������.");
        self.registerApi("����", /����/, self.stop, "������������� ���������� ���������.");

        self.registerApi("���", /���/, self.tick, "��� ����.");

        //  ������ ������ ���������� ��� �������� ������
        self.load();
        self.loadStat();


        self.master.parseInput("���.������.������� " + self.getOption("��_��"));

    }
    //  ��������� ��������
    self.save = function () {
        writeObjToFile(self.getOption("����_�������������"), self.scnList);
    }
    //  ��������� ��������
    self.load = function () {
        self.scnList = readObjectFromFile(self.getOption("����_�������������"));
    }
    // ��������� ����������
    self.saveStat = function() {
        writeObjToFile(self.getOption("����_����������_�������������"), self.stat);
    }
    // ��������� ����������
    self.loadStat = function() {
        self.stat = readObjectFromFile(self.getOption("����_����������_�������������"));
    }


    //  �������� ��������
    self.scnAdd = function (_name, _timer) {
        if (self.scnList[_name] != undefined) {
            self.clientOutputNamed("� ������ ��� ���� '" + _name + "'.")
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
        self.clientOutputNamed("�������� �������� '" + _name + "' ������ '" + _timer + "'.")
    }
    //  �������� ���������� ��������
    self.switchEnabled = function (_name) {
        if (self.scnList[_name] == undefined) {
            self.clientOutputNamed("� ������ ��� '" + _name + "'.")
            return;
        }

        self.scnList[_name].enabled = !self.scnList[_name].enabled;
        self.save();
        self.clientOutputNamed("������ �������� '" + _name + "' ������ �� '" + self.scnList[_name].enabled + "'.")
    }
    //  ������� ��������
    self.scnDel = function (_name) {
        if (self.scnList[_name] == undefined) {
            self.clientOutputNamed("� ������ ��� '" + _name + "'.")
            return;
        }

        delete self.scnList[_name];
        self.save();
        self.clientOutputNamed("����� �������� '" + _name + "'.")
    }

    //  ���������� ������ ������� ���������
    self.scnShow = function () {
        self.clientOutputMobuleTitle();
        self.clientOutput("����� ���������� / �������: " + self.stat.runTimer + " / " + self.stat.idleTimer);
        self.clientOutput("��������:");
        self.clientOutput(tab()
            + "��������".padEnd(20)
            + "���".toString().padStart(7)
            + "�����".toString().padStart(7)
            + "��".toString().padStart(7)
            + "���/c".toString().padStart(9)
            + "exp/�".toString().padStart(9)
            + "����".toString().padStart(9)
            + "����".toString().padStart(9)
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

    //  �������� ������� ���
    self.resetTimer = function (_name) {
        if (_name == "���") {
            for (var key in self.scnList) {
                self.scnList[key].toRepop = 0;
            }
            self.clientOutputNamed("�������� ������� ���� ���������.")
        } else {
            if (self.scnList[_name] == undefined) {
                self.clientOutputNamed("� ������ ��� '" + _name + "'.")
                return;
            }
            self.scnList[_name].toRepop = 0;
            self.clientOutputNamed("������� ������ �������� '" + _name + "'.")
        }
    }
    //  ���������� ����������
    self.resetStat = function () {
        for (var key in self.scnList) {
            self.scnList[key].exp = 0;
            self.scnList[key].coin = 0;
            self.scnList[key].time = 0;
            self.scnList[key].runCount = 0;
            self.scnList[key].failRunCount = 0;
        }
        self.save();
        self.clientOutputNamed("�������� ���������� ���� ���������.");

        self.stat.idleTimer = 0;
        self.stat.runTimer = 0;
        self.saveStat();

        self.clientOutputNamed("�������� ����� ����������.");
    }

    //  ����� ������
    self.tick = function () {
        self.minusScnTimer();

        if (self.mode == SC_MODE.IDLE) {
            self.runNextScenario();
            self.stat.idleTimer++;
        }

        if (self.mode == SC_MODE.RUN) {
            if (self.cmdCounter == 0) {
                var idleCounterMax = Number(self.getOption("����_����"));
                self.idleCounter++;
                self.clientOutputNamed("������ ����������� " + self.idleCounter + " �� " + idleCounterMax + ".")
                if (self.idleCounter == idleCounterMax) {
                    self.clientOutputNamed("�������, ��������������� ��������.")
                    self.master.parseInput("���.��.����");
                    self.master.parseInput("���.��.����� " + self.getOption("��_��������"));
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

    //  ������� ������ �������� � ���� ���������
    self.minusScnTimer = function () {
        for (var key in self.scnList) {
            self.scnList[key].toRepop--;
            //self.scnList[key].toRepop = self.scnList[key].toRepop > 0 ? self.scnList[key].toRepop - 1 : 0;
        }
    }

    //  ���� ��������
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
    //  ��������� ��������� ��������
    self.runNextScenario = function () {
        var scnName = self.scenarioForRun();
        if (scnName !== null) {
            self.clientOutputNamed("�������� �������� '" + scnName + " ����� ������ " + self.scnList[scnName].toRepop + ".")
            //self.clientOutputNamed("�������� �������� '" + scnName + ".")

            self.scnList[scnName].toRepop = self.scnList[scnName].timer;
            self.master.parseInput("���.��.����� " + self.scnList[scnName].name);
            self.setMode(SC_MODE.RUN);
            self.scnName = scnName;
            return true;
        }
        self.clientOutputNamed("������ ������.")
        self.setMode(SC_MODE.IDLE);
        return false;
    }
    //  ��������� ���������� ��������
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
                //self.master.parseInput("���.������.������� " + self.getOption("��_��") + " 600 ~���.��.���");
                self.runNextScenario();
            }
        }
    }
    //  ��������� ������� ��������
    self.scenarioStep = function (_message, _content) {
        self.cmdCounter++;
    }

    self.start = function () {
        self.registerReceiver("����������������", self.scenarioComplete);
        self.registerReceiver("����������������", self.scenarioStep);

        self.master.parseInput("���.������.������� " + self.getOption("��_��") + " 600 ~���.��.���");
        self.setMode(SC_MODE.RUN);
        self.runNextScenario();
    }

    self.stop = function () {
        self.removeReceiver("����������������");
        self.removeReceiver("����������������");

        self.master.parseInput("���.������.������� " + self.getOption("��_��"));
        self.setMode(SC_MODE.NONE);
    }

    //  ����� ������������
    self.constructor()

    return self;
}