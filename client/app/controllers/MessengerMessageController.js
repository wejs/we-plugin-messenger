
App.MessengerMessageController = Ember.ObjectController.extend({
  messageClass: function(){
    return 'message ' + this.get('status');
  }.property('status'),
  init: function(){
    this._super();
    var self = this;
    var message = self.get('model');

    // set access token
    //message.access_token = App.auth.getAccessToken();
  }
});
