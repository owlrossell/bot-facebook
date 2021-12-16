const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class Postback extends Model{}

Postback.init({
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    payload: DataTypes.STRING,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = Postback;