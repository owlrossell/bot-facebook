const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class Element extends Model {
}

Element.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order: DataTypes.INTEGER,
    title: {
        type: DataTypes.STRING(80),
        allowNull: false,
    },
    subtitle: DataTypes.STRING(80),
    image_url: DataTypes.STRING,
    default_action: DataTypes.STRING,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = Element;