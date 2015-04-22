App.inject( 'component:we-messenger-public-box', 'store', 'store:main' );

App.WeMessengerPublicBoxComponent = Ember.Component.extend({
  messages: null,
  messageNew: '',
  isListOpen: true,
  isVisible: false,
  // flag to check if this box is scrolled and disable goToBotton feature
  isScrolled: true,

  messageSize: 10,
  // element with messages and scrollbar
  messagesElementSelector: '.messages',

  count: null,
  limit: 15,
  page: 1,

  init: function() {
    this._super();
    var self = this;
    this.getMessagesPublic();
    // open and shown public box
    we.events.on('weMessengerOpenPublicBox', function() {
      self.send('openList');
    });

    we.events.on('weMessengerPublicMessageReceived', function (newMessage){
      self.get('store').pushPayload('message', {
        message: newMessage.message
      });
      if ( self.get('isScrolled') ) {
        self.scrollToBottom();        
      }
    });    
  },

  scrollToBottom: function scrollToBottom() {
    var element = this.$( this.get('messagesElementSelector') );

    // use one timeout to delay scroll and run after render messages inside the message box
    setTimeout(function() {
      if (element) {
        element.scrollTop(element.prop('scrollHeight'));
      }
    }, 10);
  },

  actions: {

    // onScroll: function onScroll () {
    //   var element = this.$( this.get('messagesElementSelector') );
    //   if(( element[0].scrollHeight - element.scrollTop() == element.outerHeight() ) ){
    //     this.set('isScrolled', false);
    //   } else {
    //     this.set('isScrolled', true);
    //   }
    // },

    // openList: function openList() {
    //   this.set('messages', this.get('store').filter('message', function (message) {
    //     if (!Ember.get(message, 'toId.content')) {
    //       return true;
    //     }
    //     return false;
    //   }));

    //   this.set('isVisible', true);
    //   this.scrollToBottom();
    // }.observes('messages'),

    scrollAtTop: function scrollAtTop(previousHeight) {
      var self = this;
      if ( this.get('messages.length') < this.get('count') ) {
        this.incrementProperty('page');
        // this.send('getMessagesPublic');
        this.getMessagesPublic().then(function (){
          Ember.run.scheduleOnce('afterRender', self, function() {
            var messageArea = this.$( this.get('messagesElementSelector') );
            messageArea.scrollTop( messageArea[0].scrollHeight - previousHeight );
          });
        });
      }
    },

    openList: function openList() {
      this.set('messages', this.get('store').filter('message', function (message) {
        if (!Ember.get(message, 'toId.content')) {
          return true;
        }
        return false;
      }));

      this.set('isVisible', true);
      this.scrollToBottom();
    },

    closeList: function closeList() {
    
      // set a filter to list connected users
      this.set('messages', null);

      this.set('isVisible', false);
    },
    toggleList: function toggleList() {
      if (this.get('isListOpen')) {
        this.set('isListOpen', false);
      } else {
        this.set('isListOpen', true);
      }
    },
    sendMessage: function sendOnePublicMessage() {
      var self = this;

      // if is empty messageNew ...
      if( !this.get('messageNew') ){
        return;
      }

      var messageObj = {};
      messageObj.content = this.get('messageNew');
      messageObj.toId = null;
      messageObj.status = 'sending';
      messageObj.createdAt = new Date();
      // set access token
      //messageObj.access_token = App.auth.getAccessToken();
      
      var message = this.store.createRecord('message', messageObj);
      message.set('fromId', App.currentUser);
      message.save().then(function() {
        self.set('messageNew', '');
        self.scrollToBottom();
      })
    },

    // /**
    //  * Get one list of public messages
    //  *
    //  * @param  {Function} callback runs after the server response with callback(err, response)
    //  */
    // getMessagesPublic: function getMessagesPublic() {
    //   var self = this;
    //   self.set('isLoading', true);

    //   return this.store.find('message', {
    //     limit: this.get('limit'), 
    //     skip: ( this.get('page') - 1 ) * this.get('limit')
    //   }).then(function (publicMessages){
    //     if ( publicMessages && publicMessages.meta ) {
    //       self.set('count', publicMessages.meta.count);
    //     }
    //     self.set('isLoading', false);
    //   });
    // }
  },

  /**
   * Get one list of public messages
   *
   * @param  {Function} callback runs after the server response with callback(err, response)
   */
  getMessagesPublic: function getMessagesPublic() {
    var self = this;
    self.set('isLoading', true);

    return this.store.find('message', {
      limit: this.get('limit'), 
      skip: ( this.get('page') - 1 ) * this.get('limit')
    }).then(function (publicMessages){
      if ( publicMessages && publicMessages.meta ) {
        self.set('count', publicMessages.meta.count);
      }
      self.set('isLoading', false);
    });
  },  

  didInsertElement: function () {
    var self = this;
    var messageArea = this.$(this.get('messagesElementSelector'));
    messageArea.scroll( function () {      
        if ( messageArea[0].scrollHeight - messageArea.scrollTop() === messageArea.height() ){
          return self.set('isScrolled', true); 
        }

        self.set('isScrolled', false);

        if ( messageArea.scrollTop() === 0 ){
          self.send('scrollAtTop', messageArea[0].scrollHeight);
        }
    });
  }
});
