/**
 * We chat room helper
 *
 * render onw we.js chat room
 *
 * usage:  {{we-messenger-room roomId=1 heigth=300 iframeHeight=400 width='100%'}}
 */

module.exports = function(we) {
  return function renderMessages() {
    var options = arguments[arguments.length-1];

    var html = '<iframe frameborder="0" '+
      'width="'+( options.hash.width || '100%' )+'" '+
      'height="'+( options.hash.iframeHeight || 400 )+'" '+
      'src="/widget/room/1?height='+( options.hash.height || 300 )+'"></iframe>';

    return new we.hbs.SafeString(html);
  }
}