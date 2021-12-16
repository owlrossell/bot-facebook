const Nlp = require("./Nlp"),
    Message = require("./Message"),
    Element = require("./Element"),
    QuickReply = require("./QuickReply"),
    TypeMessage = require("./TypeMessage"),
    MessageQuickReply = require("./MessageQuickReply"),
    Button = require("./Button"),
    Postback = require("./Postback"),
    PostbackMessage = require("./PostbackMessage"),
    NlpMessage = require("./NlpMessage");
const SqliteConnection = require("./database");

Nlp.belongsToMany(Message, {through: NlpMessage, timestamps: false});
Message.belongsToMany(Nlp, {through: NlpMessage, timestamps: false});

TypeMessage.hasMany(Message);
Message.belongsTo(TypeMessage);

Message.belongsToMany(QuickReply, {through: MessageQuickReply, timestamps: false});
QuickReply.belongsToMany(Message, {through: MessageQuickReply, timestamps: false});

Message.hasMany(Element);
Element.hasMany(Button);

Postback.belongsToMany(Message, {through: PostbackMessage, timestamps: false});
Message.belongsToMany(Postback, {through: PostbackMessage, timestamps: false});

// Message.hasMany(Element);
// Element.belongsTo(Message);

SqliteConnection.sync({
    // force: true,
});