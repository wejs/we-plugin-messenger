/**
 * Widget we-messenger-room main file
 *
 * See https://github.com/wejs/we-core/blob/master/lib/class/Widget.js for all Widget prototype functions
 */

module.exports = function weMessengerRoomWidget(projectPath, Widget) {
  var widget = new Widget('we-messenger-room', __dirname);

  widget.afterSave = function htmlWidgetafterSave(req, res, next) {
    req.body.configuration = {
      roomId: req.body.roomId,
      height: (req.body.height||'400'),
      iframeHeight: req.body.iframeHeight,
      width: (req.body.width|| '100%')
    };
    return next();
  };

  return widget;
};