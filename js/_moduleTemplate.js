litenBotModuleTemplate = function(_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "����";
    self.name = "Liten bot: template module";
    self.version = "0.0";
    self.description = "������ ������.";
    self.author = "unknown";

    //  ����������� ����������

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  ��������� ������ - ��������� �������� ����� �������� �����������
        self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����� ������������� ������������
        parentConstructor();

        //  ��������� ������ - ������ � �������� ���������� ��� ������
        //self.createOption("�������", "���", "��� ������� - �� / ���", "string");

        //  ����������� ������� api
        ///self.registerApi("���", /��� (\S+)/, self.add, "�������� ����� ����� / ���������� ��������� / ������ � ������� ���������� ����.");

        //  ������ ������ ���������� ��� �������� ������
    }


    self.start = function() {
        self.setOption("�������", "��");
        self.master.parseInput("���.������.������� " + self.getOption("�������") + " " + self.getOption("�����_������_��") + " ~���.���.���������");
    }

    self.stop = function() {
        self.setOption("�������", "���");
        self.master.parseInput("���.������.������� " + self.getOption("�������"));
    }

    //  ��������� �������� ���������
    var parentParseInput = self.parseInput;
    self.parseInput = function(_text) {
        _text = parentParseInput(_text);
        if (_text === null) {
            return null;
        }
        return _text;
    }

    //  ����� �����������
    self.constructor()

    return self;
}