
App.MessengerBoxView = Ember.View.extend({

  tabindex: '0',

  attributeBindings: ['tabindex'],

  didInsertElement: function(){
    var boxId = this.get('boxId');

    this.$('.contact-chat').focus();

    this.$('.contact-chat').on('focusin', $.proxy(this.focusIn,this) );
    this.$('.contact-chat').on('focusout', $.proxy(this.focusOut,this) );
  },

  willDestroyElement: function(){
    this.$('.contact-chat').off('focusin', $.proxy(this.focusIn,this) );
    this.$('.contact-chat').off('focusout', $.proxy(this.focusOut,this) );
  },

  focusIn: function() {
    this.get('controller').send('focusToggle', true);
  },

  focusOut: function() {
    this.get('controller').send('focusToggle', false);
  }
});