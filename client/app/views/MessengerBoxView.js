
App.MessengerBoxView = Ember.View.extend({

  tabindex: '0',

  attributeBindings: ['tabindex'],

  didInsertElement: function(){
    var self = this;

    this.$('input').focus();

    this.$('.contact-chat').on('focusin', $.proxy(this.focusIn,this) );
    this.$('.contact-chat').on('focusout', $.proxy(this.focusOut,this) );

    var messageArea = this.$('.messages');
    messageArea.scroll( function () {
        if ( messageArea[0].scrollHeight - messageArea.scrollTop() === messageArea.height() ){
          return self.get('controller').send('lockScroll', true); 
        }

        self.get('controller').send('lockScroll', false);

        if ( messageArea.scrollTop() === 0 ){
          self.get('controller').send('scrollAtTop', messageArea, messageArea[0].scrollHeight);
        }
    });    
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