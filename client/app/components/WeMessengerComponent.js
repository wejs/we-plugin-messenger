App.WeMessengerComponent = Ember.Component.extend({

  didInsertElement: function() {
    window.weMessengerList.initialize({
      weMessengerTag: this.elementId
    });
  }
});