const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class PostbackMessage extends Model{}

PostbackMessage.init({
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    order: DataTypes.INTEGER,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = PostbackMessage;