
App.MessengerBoxController = Ember.ObjectController.extend({
  messageNew: '',
  contact: {},
  messages: [],
  isListOpen: 'show', // show | close
  //flags
  isVisible: true,
  isWriting: false,
  isContactWritingTime: 2000,

  iAmWritingTimeout: false,
  isWritingTime: 3500,
  // placeholder for message input
  messagePlaceholder: '',

  socket: null,

  // flag to check if this box is scrolled and disable goToBotton feature
  isScrolled: true,

  hasNews: false,
  hasFocus: false,
  isStarted: false,

  // element with messages and scrollbar
  messagesElementSelector: '.messages',

  isOnline: function(){
    if( this.get('model.onlineStatus') == 'online' ) {
      return true;
    }
    return false;
  }.property('model.onlineStatus'),

  boxId: function() {
    return 'messengerBox-'+ this.get('id');
  }.property('id'),

  goToBottomTimeOut: null,

  goToBottomOnUpdate: function() {
    if (!this.get('isScrolled')) {
      this.send('scrollToBottom');
    }

    if(this.get('isStarted') && !this.get('hasFocus')) {
      this.set('hasNews', true);
    }
  }.observes('messages.@each'),

  sendIsWriting: function() {
    if( this.get('messageNew').trim() ) {
      this.send('emitIsWriting');
    }

  }.observes('messageNew'),

  contactUserId: function() {
    if (this.get('to.id') != App.currentUser.id ) {
      return this.get('to.id') ;
    }
    // check if are a message from authenticated user
    // to box user id
    if (this.get('from.id') != App.currentUser.id) {
      return this.get('from.id');
    }
  }.property('contact'),

  init: function() {
    this._super();
    var self = this;
    var contactId = self.get('contactUser.id');

    if( contactId ) {
      this.send('getMessagesWithUser');
    }

    /**
     * Filter messaget with authenticaded user and contact user id
     */
    self.set('messages', this.get('store').filter('message',
      function(message) {
        // check if are a message to authenticated user
        // form contact user id
        if(
          message.get('toId.id') == App.currentUser.id &&
          message.get('fromId.id') == contactId
        ) {
          return true;
        }
        // check if are a message from authenticated user
        // to box user id
        if(
          message.get('fromId.id') == App.currentUser.id &&
          message.get('toId.id') == contactId
        ) {
          return true;
        }
        return false;
      }
    ));

    /**
     * Receive a user is writing notification
     * @param  Object data
     */
    io.socket.on('user:writing', this.onContactWriting.bind(this));
  },

  onContactWriting: function(data) {
    var self = this;

    if (data.user && data.user.id) {
      if ( this.get('contactUserId') == data.user.id && !this.get('isWriting')) {

        // set one delay for re-send this event
        self.set('isWriting', setTimeout(function isWritingTime(){
          self.set('isWriting', false);
        }, self.get('isContactWritingTime')));
      }
    }
  },

  willDestroyElement: function(){
    this._super();
    io.socket.removeListener('user:writing', this.onContactWriting.bind(this));
  },

  actions: {
    lockScroll: function lockScroll (flag) {
      this.set('isScrolled', flag);
    },

    focusToggle: function(flag) {
      this.set('hasFocus', flag);
      // has focus
      if(flag && this.get('isVisible')) {
        this.set('hasNews', false);
        this.send('markAllAsRead');
      }
    },

    /**
     * Mark all unread messages as read
     *
     */
    markAllAsRead: function( ) {
      var messages = this.get('messages');

      messages.forEach(function(message){
        if (!message.get('read') ) {
          // only mark as read messages how you received
          if( message.get('fromId.id') != App.currentUser.id) {
            message.set('read', true);
            message.save();
          }
        }
      })
    },

    openList: function(){
      this.set('isVisible', 'show');
    }.observes('messages'),
    closeList: function() {
      this.set('model.isTalking', false);
    },
    toggleList: function(){
      if(this.get('isListOpen') === 'hide'){
        this.set('isListOpen', 'show');
      }else{
        this.set('isListOpen', 'hide');
      }
      this.send('scrollToBottom');
    },

    scrollToBottom: function(){
      var self = this;

      // use one timeout to delay scroll and run after render messages inside the message box
      setTimeout(function(){
        var element = $( '#' + self.get('boxId') );
        if(element && element.scrollTop){
          element.scrollTop(element.prop('scrollHeight'));
        }
      }, 10);
    },

    /**
     * Get messages how authenticated user has did with user id
     */
    getMessagesWithUser: function messagesWithUser(){
      var self = this;

      var id = self.get('contactUser.id');

      self.get('store').find('message', {
        uid: id
      }).then(function () {
        self.set('isStarted', true);
        self.send('scrollToBottom');
      });
    },

    sendMessage: function sendMessageToContact(){
      var self = this;
      // if is empty messageNew ...
      if( !this.get('messageNew') ){
        return;
      }

      // preload authenticated user record
      this.get('store').find('user', App.currentUser.id)
      .then(function(currentUser) {
        // create the record and let message controller save the record in db
        var message = self.get('store').createRecord('message', {
          content: self.get('messageNew'),
          toId: self.get('contactUser'),
          fromId: currentUser,
          createdAt: new Date(),
          status: 'sending'
        });
        // clean input box
        self.set('messageNew', '');
        // scroll to bottom after send a message
        self.send('scrollToBottom');

        message.save().then(function() {
          setTimeout(function(){
            message.set('status', 'salved');
          }, 3000);
          message.set('status', 'send');
        },function(e){
          console.warn('err:',e);
        });
      })
    },

    /**
     * Send one i am writing event to other contact
     *
     * @param  {string}   contactId contact id
     * @param  {Function} callback  optional callback(err, response)
     */
    emitIsWriting: function emitIsWriting(){
      var self = this;
      var contactId = this.get('contactUserId');

      // only send this event every "isWritingTime" secconds
      if( !self.get('iAmWritingTimeout') ){
        io.socket.post('/messenger/user/writing',{
          toUserId: contactId
        },function(resp){
          if(resp.status && resp.status !== 200) {
            Ember.Logger.error('Error on emitIsWriting',resp);
          }
        });
        // set one delay for re-send this event
        self.set('iAmWritingTimeout', setTimeout(function(){
          self.set('iAmWritingTimeout', false);
        }, self.get('isWritingTime') ));
      }
    }
  } // end actions
});
