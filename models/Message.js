const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class Message extends Model{}

Message.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: DataTypes.STRING,
    text: DataTypes.TEXT,
}, {
    sequelize: sqliteConnection,
    timestamps:false,
})

module.exports = Message;