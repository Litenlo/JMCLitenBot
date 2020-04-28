litenBotGlobalParser = function(_master) {
    var self = new absModule(_master);

    //  ������������ ���������� ������
    self.apiname = "����";
    self.name = "Liten bot: global parser";
    self.version = "1.0";
    self.description = "���������� ������.";

    //  ����������� ����������
    var parsers = [];

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
        self.registerParser(/(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)C/, self.psPrompt);
    }

    self.registerParser = function(_rx, _fnc) {
        parsers.push({rx: _rx, fnc: _fnc});
    }

    self.psPrompt = function(_hp, _mn, _mv, _exp, _meg) {
        /*
        self.clientOutputNamed("���� " + _hp);
        self.clientOutputNamed("���� " + _mn);
        self.clientOutputNamed("���� " + _mv);
        self.clientOutputNamed("���� " + (_meg === "M" ? _exp * 1000 : _exp));
         */
    }

    //  ��������� �������� ���������
    self.parseIncoming = function(_text) {
        _cleartext = removeColor(_text);
        for (var i = 0; i < parsers.length; i++) {
            var parseInfo = parsers[i];
            if (regexp(parseInfo.rx, _cleartext)) {
                fnc = parseInfo.fnc;
                var params = regexpResult;
                params.shift();
                fnc.apply(this, params);
            }
        }
        return _text;
    }

    //  ����� �����������
    self.constructor()

    return self;
}