App.WeChatBoxComponent = Ember.Component.extend({
  tagName: 'iframe',
  attributeBindings: ['width', 'height', 'frameborder', 'src'],
  src: null,
  width: '100%',
  height: '400px',

  listHeight: '300',

  frameborder: 0,

  roomId: null,

  init: function() {
    this._super();

    if (!this.roomId)
      return Ember.Logger.error('WeChatBoxComponent requires a roomId');

    this.set(
      'src', '/widget/room/' + this.get('roomId') + '?height=' + this.get('listHeight')
    );
  }
});