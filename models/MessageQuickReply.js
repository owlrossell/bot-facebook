const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class MessageQuickReply extends Model{}

MessageQuickReply.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order: DataTypes.INTEGER,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = MessageQuickReply;