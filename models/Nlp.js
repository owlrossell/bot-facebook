const {Model, DataTypes} = require('sequelize');
const sqliteConnection = require("./database");

class Nlp extends Model {
}

Nlp.init({
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    intention: DataTypes.STRING(50),
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = Nlp;