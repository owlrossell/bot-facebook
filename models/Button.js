const {Model, DataTypes} = require("sequelize");
const sqliteConnection = require("./database");

class Button extends Model{}

Button.init({
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
    },
    order: DataTypes.INTEGER,
    type: DataTypes.STRING,
    title: DataTypes.STRING,
    payload: DataTypes.STRING,
    url: DataTypes.STRING,
    webview_height_ratio: DataTypes.STRING,
    messenger_extensions: DataTypes.STRING,
    fallback_url: DataTypes.STRING,
    webview_share_button: DataTypes.STRING,
}, {
    sequelize: sqliteConnection,
    timestamps: false,
})

module.exports = Button;