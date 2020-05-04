litenBotMain = function() {
    var self = new absModule();

    self.apiname = "���";
    self.name = "Liten bot: core";
    self.version = "1.2";
    self.description = "���� ����. � ���� ������������ ������. ���� �������� �� ������������� ��������.\r\n�� ���� �������� ������ �� noliten@outlook.com ��� ������� ������� � ����� �����\r\n��� ��������� ������� �� ������ ������� " + self.apiname + ".NAME.������, ��� NAME - ��� � ������� � ������ �������.";
    self.author = "������";

    //  ���� ��� ������ �������
    var messages = [];

    //  ���������� ����� ���������
    self.sendMessage = function(_message, _content) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("����������� ��� ��������� '" + _message + "'.");
            return;
        }
        if (self.listenersCount(_message) === 0) {
            self.clientOutputNamed("��� ����������� ��� ��������� ���� '" + _message + "'.");
            return;
        }
        for (var i = 0; i < messages[_message].listeners.length; i++) {
            messages[_message].listeners[i].receiveMessage(_message, _content);
        }
    }

    //  �������� ����� ��� ���������
    self.addMessage = function(_source, _message) {
        if (messages[_message] !== undefined) {
            self.clientOutputNamed("��������� '" + _message + "' ��� ���������������� �� ������ '" + messages[_message].source.name + "'.");
            return;
        }
        messages[_message] = {
            source: _source,
            listeners: []
        }
        self.clientOutputNamed("��������� '" + _message + "' ���������������� �� ������ '" + messages[_message].source.name + "'.");
    }

    //  �������� ���������
    self.addListener = function(_message, _listener) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("����������� ��� ��������� '" + _message + "'.");
            return;
        }
        messages[_message].listeners.push(_listener);
        self.clientOutputNamed("��� ��������� '" + _message + "' ��������������� ����� ��������� '" + _listener.name + "'.");
    }

    //  ������� ���������
    self.removeListener = function(_message, _listener) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("����������� ��� ��������� '" + _message + "'.");
            return;
        }
        var indexOfListener = findInArray(messages[_message].listeners, _listener);
        if (indexOfListener === -1) {
            self.clientOutputNamed("��������� '" + _listener.name + "' �� �������� �� ��� ��������� '" + _message + "'.");
            return;
        }
        messages[_message].listeners.splice(indexOfListener, 1);
        self.clientOutputNamed("��� ��������� '" + _message + "' ����� ��������� '" + _listener.name + "'.");
    }

    //  ���������� ���������� ���������� ���������
    self.listenersCount = function(_message) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("����������� ��� ��������� '" + _message + "'.");
            return;
        }
        return messages[_message].listeners.length;
    }



    self.constructor();

    return self;
}