const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class TypeMessage extends Model {
}

TypeMessage.init({
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    name: DataTypes.STRING,
},{
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = TypeMessage;