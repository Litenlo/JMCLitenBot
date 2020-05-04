litenBotMain = function() {
    var self = new absModule();

    self.apiname = "лит";
    self.name = "Liten bot: core";
    self.version = "1.2";
    self.description = "Ядро бота. К ядру подключаются модули. Ядро отвечает за маршрутизацию запросов.\r\nПо всем вопросам пишите на noliten@outlook.com или теляйте Литьену в Сфере миров\r\nДля получения справки по модулю вызвать " + self.apiname + ".NAME.помощь, где NAME - имя в скобках в списке модулей.";
    self.author = "Литьен";

    //  Шина для обмена данными
    var messages = [];

    //  отправляет новое сообщение
    self.sendMessage = function(_message, _content) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("Неизвестный тип сообщения '" + _message + "'.");
            return;
        }
        if (self.listenersCount(_message) === 0) {
            self.clientOutputNamed("Нет получателей для сообщения типа '" + _message + "'.");
            return;
        }
        for (var i = 0; i < messages[_message].listeners.length; i++) {
            messages[_message].listeners[i].receiveMessage(_message, _content);
        }
    }

    //  добавить новый тип сообщений
    self.addMessage = function(_source, _message) {
        if (messages[_message] !== undefined) {
            self.clientOutputNamed("Сообщение '" + _message + "' уже зарегистрировано от модуля '" + messages[_message].source.name + "'.");
            return;
        }
        messages[_message] = {
            source: _source,
            listeners: []
        }
        self.clientOutputNamed("Сообщение '" + _message + "' зарегистрировано от модуля '" + messages[_message].source.name + "'.");
    }

    //  добавить слушателя
    self.addListener = function(_message, _listener) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("Неизвестный тип сообщения '" + _message + "'.");
            return;
        }
        messages[_message].listeners.push(_listener);
        self.clientOutputNamed("Для сообщения '" + _message + "' зарегистрирован новый слушатель '" + _listener.name + "'.");
    }

    //  удаляет слушателя
    self.removeListener = function(_message, _listener) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("Неизвестный тип сообщения '" + _message + "'.");
            return;
        }
        var indexOfListener = findInArray(messages[_message].listeners, _listener);
        if (indexOfListener === -1) {
            self.clientOutputNamed("Слушатель '" + _listener.name + "' не подписан на тип сообщения '" + _message + "'.");
            return;
        }
        messages[_message].listeners.splice(indexOfListener, 1);
        self.clientOutputNamed("Для сообщения '" + _message + "' удалён слушатель '" + _listener.name + "'.");
    }

    //  возвращает количество слушателей сообщения
    self.listenersCount = function(_message) {
        if (messages[_message] === undefined) {
            self.clientOutputNamed("Неизвестный тип сообщения '" + _message + "'.");
            return;
        }
        return messages[_message].listeners.length;
    }



    self.constructor();

    return self;
}