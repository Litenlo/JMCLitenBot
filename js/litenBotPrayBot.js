 litenBotPrayBot = function(_master) {
    var self = new absModule(_master);

    self.apiname = "���";
    self.name = "Liten bot: pray bot";
    self.version = "1.1";
    self.description = "��� ��� ������������ ��������� ��������� �����������."
    self.author = "������";

    var goodWords = [];
    var godWordReg;
    var badLineCounter = 0;

    var parentConstructor = self.constructor;
    self.constructor = function() {

        self.createOption("�������", "���", "��� ������� - �� / ���", "string");
        self.createOption("����_�������", "data/word_dict_file.dat", "���� ��� ���������� ���������� ���� / ���������� ��������� / ��������", "string");
        self.createOption("�������", "��", "�������� ��������� ������", "string");
        self.createOption("�������", "���", "�������� �������� ������", "string");
        self.createOption("�����_�������", "��", "�������� ����� � �������� �������", "string");
        self.createOption("����_������", "10", "������������ ���������� ���������� ����� ��� ������� ��������� ��������������", "string");
        self.createOption("�����_������_��", "100", "����� ������ �������� ���������� �����", "string");
        self.createOption("�������", "701", "������������� �������� (� ���� ��� ������ ������ ���)", "string");
        self.createOption("����_�����", "���������� ������������ �������� ����������� �����!", "�����, ������� ����� ������� ��� ���������� '����_������'", "string");

        parentConstructor();
        //  ������ � �������� ���������� ��� ������

        self.registerApi("���", /��� (\S+)/, self.add, "�������� ����� ����� / ���������� ��������� / ������ � ������� ���������� ����.");
        self.registerApi("��", /�� (\S+)/, self.del, "������� ����� / ���������� ��������� / ������ �� ������� ���������� ����.");
        self.registerApi("�����", /�����/, self.start, "��������� ������ ����.");
        self.registerApi("����", /����/, self.stop, "������������� ������ ����.");
        self.registerApi("���������", /���������/, self.resetBadLineCounter, "���������� ������� ������ �����.");

        self.loadGoodWords();
        self.genGodWordReg();
    }

    self.resetBadLineCounter = function() {
        badLineCounter = 0;
    }

    self.saveGoodWords = function() {
        writeObjToFile(self.getOption("����_�������"), goodWords);
    }


    self.loadGoodWords = function() {
        var wd = readObjectFromFile(self.getOption("����_�������"));
        for (var ind in wd) {
            goodWords.push(wd[ind]);
        }
    }

    self.genGodWordReg = function() {
        var tmp = "�����";
        for (var i = 0; i < goodWords.length; i++) {
            tmp = tmp + "|" + goodWords[i];
        }
        godWordReg = new RegExp(tmp, "i");
    }

    self.add = function(_word) {
        goodWords.push(_word);
        self.saveGoodWords();
        self.clientOutputNamed("'" + _word + "' ��������� (" + goodWords.length + ").");
        self.genGodWordReg();
    }

    self.del = function(_word) {
        var index = findInArray(goodWords, _word);
        if (index > -1) {
            goodWords.splice(index, 1);
            self.clientOutputNamed("'" + _word + "' ������� (" + goodWords.length + ").");
        } else {
            self.clientOutputNamed("'" + _word + "' ��� � �������");
        }
    }

    self.start = function() {
        self.setOption("�������", "��");
        self.master.parseInput("���.������.������� " + self.getOption("�������") + " " + self.getOption("�����_������_��") + " ~���.���.���������");
    }

    self.stop = function() {
        self.setOption("�������", "���");
        self.master.parseInput("���.������.������� " + self.getOption("�������"));
    }

    self.parseIncoming = function(_text) {
        if (self.getOption("�������") === "��") {
            _cleartext = removeColor(_text);

            if (_cleartext === "" || regexp(godWordReg, _cleartext) != null) {
                if (self.getOption("�������") === "��") {
                    _text = _text + color("32;1") + "[+] "  + color("0");
                }

                if (self.getOption("�����_�������") === "��" && _cleartext !== "") {
                    _text = _text + " [" + regexpResult[0] + "]";
                }
            }
            else
            {
                badLineCounter++;
                if (self.getOption("�������") === "��") {
                    _text = _text + color("31;1") + " |[" + badLineCounter + "]|" + color("0");
                }
                //self.clientOutputNamed(color("31") + "���������� ����������� ����� - " + badLineCounter);
                if (badLineCounter.toString() === self.getOption("����_������")) {
                    jmc.play("sounds/chbell.wav");
                    _text = _text + " " + color("41;1") + "*" + self.getOption("����_�����") + color("0");
                }
            }
        }
        return _text;
    }


    self.constructor()

    return self;
}