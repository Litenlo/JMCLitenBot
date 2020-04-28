 litenBotTimers = function(_master) {
    var self = new absModule(_master);

    self.apiname = "������";
    self.name = "Liten bot: timers";
    self.version = "1.0";
    self.description = "������ � ����������� ���������. ������� ��� ������������� ��������.";
    self.author = "������";

    var timers = [];

    var parentConstructor = self.constructor;
    self.constructor = function() {
        parentConstructor();
        self.registerApi("�������", /������� (\S+) (\S+) (.*)/, self.create, "������� ����� ������. ��������� id - ������������� (�����), msec - ������������ (�����), fnc / text - �������� �� ������ (������). ������: BOTNAME." + self.apiname + ".create 777 100 ���� - ����� ��������� ������ 10 ������.");
        self.registerApi("�������", /������� (.*)/, self.kill, "������� ������. ��������� id - ������������� (�����).");
        self.registerApi("������", "������", self.list, "��������� ������ ��������.");

        self.createOption("����_��������", "data/timer_data.dat", "���� ��� ���������� ��������", "string");
        self.createOption("����_�����", "���", "���������� ��������� ��� ������������ �������", "string");

        //restart saved timers
        var saved_timers = readObjectFromFile(self.getOption("����_��������"))
        for (var id in saved_timers) {
            self.create(id, saved_timers[id].msec, saved_timers[id].fnc);
        }
    }

    self.create = function(_id, _msec, _fnc) {
        timers[_id] = {fnc: _fnc, msec: _msec};
        jmc.SetTimer(_id, _msec);
        self.clientOutputNamed("������� ������ '" + _id + "' ������ '" + _msec + "' ����.");

        writeObjToFile(self.getOption("����_��������"), timers);
    };

    self.kill = function(_id) {
        delete timers[_id];
        jmc.KillTimer(_id);
        self.clientOutputNamed("���������� ������ '" + _id + "'.");

        writeObjToFile(self.getOption("����_��������"), timers);
    }

    self.list = function() {
        self.clientOutput("\r\n������ ��������:");
        for (var name in timers) {
            self.clientOutput(tab() + name + " - " + timers[name].msec + " ����: " + timers[name].fnc);
        }
        self.clientOutput("");
    }

    self.onTimer = function() {
        var timerId = jmc.Event;
        if (timers[timerId] !== undefined ) {
            var action = timers[timerId].fnc;
            self.action(action);
            if (self.getOption("����_�����") === "��") {
                self.clientOutputNamed("�������� ������ '" + timerId + "'.");
            }
        }
    }

    self.constructor();

    return self;
}