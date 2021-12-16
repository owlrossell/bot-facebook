const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class NlpMessage extends Model {
}

NlpMessage.init({
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

module.exports = NlpMessage;