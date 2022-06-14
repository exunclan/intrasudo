'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define('Notifications', {
    content: DataTypes.STRING
  }, {});
  Notifications.associate = function(models) {
    // associations can be defined here
  };
  return Notifications;
};