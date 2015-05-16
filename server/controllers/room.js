/**
 * RoomsController
 *
 * @module    :: Controller
 * @description :: Contains logic for handling requests.
 */

var path = require('path');

module.exports = {
  usersGet: function (req, res, next){
    console.log('@todo rooms usersGet');
    next();
  },

  roomIframe: function roomIframe(req, res) {
    if (!res.locals.record) return res.notFound();

    var we = req.getWe();

    res.locals.title = res.locals.record.name;
    res.locals.jsonRecord = JSON.stringify(res.locals.record.toJSON());
    res.locals.currentUserJsonRecord = JSON.stringify(req.user.toJSON());

    res.locals.showTitle = req.query.showTitle === 'true';

    res.locals.height = Number(req.query.height) || 300;

    res.locals.isAuthenticated = req.isAuthenticated();

    if (req.user && req.user.language) {
      res.locals.locale = req.user.language;
    } else {
      res.locals.locale = we.config.i18n.defaultLocale;
    }

    res.locals.layout = false;
    res.render(path.resolve(__dirname, '..', 'templates/room.hbs'));
  }
};
