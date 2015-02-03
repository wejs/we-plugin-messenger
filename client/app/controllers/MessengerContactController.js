
App.MessengerContactController = Ember.ObjectController.extend({
  contactClass: function() {
    if(this.get('model.onlineStatus')) {
      return 'contact ' + this.get('model.onlineStatus');
    } else {
      return 'contact offline';
    }
  }.property('model.onlineStatus'),

  isOnline: function(){
    if( this.get('model.onlineStatus') == 'online' ) {
      return true;
    }
    return false;
  }.property('model.onlineStatus')
});
