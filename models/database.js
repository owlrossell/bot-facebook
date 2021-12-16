const {Sequelize} = require("sequelize");

const sqliteConnection = new Sequelize({
    dialect: 'sqlite',
    storage: process.cwd() + '/database.db',
    logging: false,
})

module.exports = sqliteConnection;