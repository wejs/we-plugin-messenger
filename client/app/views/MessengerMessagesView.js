
App.MessengerMessagesView = Ember.View.extend({
  classNames: ['messages'],

  didInsertElement: function(){
    this.$().on('scroll', $.proxy(this.didScroll,this) );
  },

  willDestroyElement: function(){
    // have to use the same argument to `off` that we did to `on`
    this.$().off('scroll', $.proxy(this.didScroll,this) );
  },

  // this is called every time we scroll
  didScroll: function(){
    if(( this.$()[0].scrollHeight - this.$().scrollTop() == this.$().outerHeight() ) ){
      this.get('controller').send('lockScroll', false);
    } else {
      this.get('controller').send('lockScroll', true);
    }
  }
});
