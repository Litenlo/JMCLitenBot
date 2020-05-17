litenBotGlobalParserSow = function(_master) {
    var self = new litenBotGlobalParser(_master);

    //  родительские переменные модуля
    self.apiname = "парс";
    self.name = "Liten bot: global parser (SOW mud)";
    self.version = "1.0";
    self.description = "Глобальный парсер для Сферы Миров.";
    self.author = "Литьен";

    //  собственные переменные

    //  конструктор
    var parentConstructor = self.constructor;
    self.constructor = function() {
        //  вызов родительского конструктора
        parentConstructor();

        //  состояние
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, "Состояние");
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psFightPrompt, false, self.parseMode.ALWAYS, "СтатусБитвы");
        self.registerParser(/сражается с вами!/, self.psFightWithYou, false, self.parseMode.ALWAYS, "СражаетсяСВами");

        //  другие методы вызываемые при создании модуля
        var group = "";
        //  room
        group = "Комната";
        self.registerParser(/^(\d+)H (\d+)M (\d+)V (\d+)+(M?)X (\d+)[C|С] (.+)/, self.psPrompt, false, self.parseMode.ALWAYS, group);
    }

    //  вызов констурктор
    self.constructor()

    return self;
}