litenBotGlobalParserSow = function(_master) {
    var self = new litenBotGlobalParser(_master);

    //  ������������ ���������� ������
    self.apiname = "����";
    self.name = "Liten bot: global parser (SOW mud)";
    self.version = "1.0";
    self.description = "���������� ������ ��� ����� �����.";
    self.author = "������";

    //  ����������� ����������

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  ����� ������������� ������������
        parentConstructor();

        //  ���������
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, "���������");
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psFightPrompt, false, self.parseMode.ALWAYS, "�����������");
        self.registerParser(/��������� � ����!/, self.psFightWithYou, false, self.parseMode.ALWAYS, "��������������");
        self.registerParser(/(.+) R.I.P./, self.psMobRIP, false, self.parseMode.ALWAYS, "���");

        //  ������
        self.registerParser(/^���� �� ������ �������\?/, self.psNoAtackMobError, false, self.parseMode.ALWAYS, "�����������������");

        //  ������ ������ ���������� ��� �������� ������
        var group = "";
        //  room
        group = "�������";
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|�] (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, group);
    }

    //  ����� �����������
    self.constructor()

    return self;
}