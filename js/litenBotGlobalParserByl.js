litenBotGlobalParserByl = function(_master) {
    var self = new litenBotGlobalParser(_master);

    //  ������������ ���������� ������
    self.apiname = "����";
    self.name = "Liten bot: global parser (Bylins mud)";
    self.version = "1.0";
    self.description = "���������� ������ ��� �����.";
    self.author = "������";

    //  ����������� ����������

    //  �����������
    var parentConstructor = self.constructor;
    self.constructor = function() {

        //  ����� ������������� ������������
        parentConstructor();

        //  ���������
        self.registerParser(/^(\d+)H (\d+)M (\d+)� .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, "���������");
        self.registerParser(/^(\d+)H (\d+)M (\d+)� .+ (\d+)G (.+)/, self.psFightPrompt, false, self.parseMode.ALWAYS, "�����������");

        //  ������ ������ ���������� ��� �������� ������
        var group = "";
        //  room
        group = "�������";
        self.registerParser(/^(\d+)H (\d+)M (\d+)� .+ (\d+)G (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, group);
        self.registerParser(/^\u001b\[1;33m\u001b\[1;31m(.+)/, self.psMobsStart, true, self.parseMode.ITEMS, group);
    }
    //  ������� ������ ��������� ���
    var parent_psFightPrompt = self.psPrompt;
    self.psFightPrompt = function(_hp, _mv, _exp, _coin, _other) {
        parent_psFightPrompt(_hp, 0, _mv, _exp, "", _coin, _other);
    }

    //  ������� ������ ���������
    var parent_psPrompt = self.psPrompt;
    self.psPrompt = function(_hp, _mv, _exp, _coin, _other) {
        parent_psPrompt(_hp, 0, _mv, _exp, "", _coin, _other);
    }

    //  ����� �����������
    self.constructor()

    return self;
}