const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class QuickReply extends Model {
}

QuickReply.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    contentType: DataTypes.STRING,
    title: DataTypes.STRING,
    payload: DataTypes.STRING,
    imageURL: DataTypes.STRING,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
});

module.exports = QuickReply;