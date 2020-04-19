 litenBotMain = function() {
    var self = new absModule();

    self.apiname = "лит";
    self.name = "Liten bot: core";
    self.version = "1.0";
    self.description = "ядро бота.   €дру подключаютс€ модули. ядро отвечает за маршрутизацию запросов.\r\nѕо всем вопросам пишите на noliten@outlook.com или тел€йте Ћитьену\r\nƒл€ получени€ справки по модулю вызвать " + self.apiname + ".NAME.help, где NAME - им€ в скобках в списке модулей.";

    self.constructor();

    return self;
}