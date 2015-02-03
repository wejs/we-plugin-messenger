
App.inject( 'component:we-messenger', 'store', 'store:main' );

App.WeMessengerComponent = Ember.Component.extend({
  // contacts on list
  contacts: [],
  // open contact box
  openContacts: [],
  isListOpen: true,
  socket: null,
  init: function initWeMessengerComponent(){
    this._super();
    var self = this;

    if( !this.get('socket') ){
      if(window.io && window.io.socket){
        this.set('socket', window.io.socket);
      } else {
        return console.error('Socket.io not found in App.WeMessengerComponent.init()');
      }
    }

    // set a filter to list connected users
    this.set('contacts', this.get('store').filter('contact', function (contact) {
      if (contact.get('status') == 'accepted') {
        return true;
      }
      return false;
      // body...
    }));

    // filter to show only open contacts
    this.set('openContacts', this.get('store').filter('contact', { isTalking: true },
      function(contact) {
        return contact.get('isTalking');
      }
    ));

    self.setMessengerEvents();
    // start the messenger and send is connected message to authenticated user contacts
    Ember.run.later(self, function() {
      self.send('startMessenger');
    }, 1500);

    // this.send('getContactList');

    we.events.on('we-messenger-contact-connected',function(user){
      self.get('contacts').every(function(contact) {
        // find the user contact in contact list
        if (
          ( contact.get('to.id') == user.id ) ||
          ( contact.get('from.id') == user.id )
        ) {
          contact.set('onlineStatus', 'online');
          return false;
        }
        // next item
        return true;
      });
    });

    we.events.on('we-messenger-contact-diconnected',function(user){
      self.get('contacts').every(function(contact) {
        // find the user contact in contact list
        if (
          ( contact.get('to.id') == user.id ) ||
          ( contact.get('from.id') == user.id )
        ) {
          contact.set('onlineStatus', 'offline');
          return false;
        }
        // next item
        return true;
      });
    });

    we.events.on('sails:created:message', function OnReceiveMessage(socketMessage) {
      if (!socketMessage.data.fromId) return;
      if ( socketMessage.data.fromId != App.currentUser.id) {
        var contactId = socketMessage.data.contactId;
        self.get('store').find('contact', contactId).then(function(contact){
          contact.set('isTalking', true);
        })
      }
    });
  },
  didInsertElement: function didInsertElement() {
    if (!this.get('store')) {
      throw 'WeMessengerComponent requires store for autocomplete feature. Inject as store=store';
    }
  },
  willDestroyElement: function willDestroyElement(){
    console.warn('TODO! willDestroyElement unsubscribe from events here', this);
  },
  actions: {
    openList: function openList(){
      this.set('isListOpen', true);
      //this.get('openContacts').pushObject({      name: 'oi2',})
    },
    closeList: function closeList(){
      this.set('isListOpen', false);
    },
    startTalk: function startTalk(contact) {
      contact.set('isTalking', true);
    },
    openPublicBox: function openPublicBox(){
      we.events.trigger('weMessengerOpenPublicBox');
    },

    /**
     * Start messenger, use to check if user is logged in and have permissions to use the messenger.
     * And to send a is connected message to yours contacts
     */
    startMessenger: function startMessenger() {
      this.get('socket').get('/messenger/start', function (response) {
        if(response.status === 200 || !response.status){
          // can use the messenger
        }else{
          // error code like 403
          console.error(response);
        }
      });
    },

    // /**
    //  * Load in store all contacts for current authenticated user
    //  */
    // getContactList: function getContactList(){
    //   this.get('store').find('contact');
    // }
  },
  getMessages: function getMessages(id, callback){
    // TODO change to use WEjs get messages
    var store = this.get('store');

    store.find('messages', { uid: id })
    .then(function(messages){
      callback(null,messages);
    }, function(error){
      callback(error,null);
    });
  },
  isOpenContactBox: function isOpenContactBox(userId){
    var openContacts = this.get('openContacts');
    var len = openContacts.length;
    for(var i=0; i < len; i++){
      if(openContacts[i].id === userId){
        return true;
      }
    }
    return false;
  },
  getUserFromContacts: function getUserFromContacts(userId){
    var contacts = this.get('contacts');
    var len = contacts.length;
    for(var i=0; i < len; i++){
      if(contacts[i].id === userId){
        return contacts[i];
      }
    }
    return false;
  },

  /**
   * Set socket.io messenger events
   */
  setMessengerEvents: function setMessengerEvents(){
    var socket = this.get('socket');
    /**
     * Receive a we.io message
     * @param  Object data
     */
    socket.on('receive:message', function(data) {
      if(!App.get('auth.isAuthenticated') ) return false;
      if(data.message){
        we.events.trigger('we-messenger-message-received', data.message);
      }
    });

    /**
     * Receive a bublic message
     * @param  Object data
     */
    socket.on('receive:public:message', function(data) {
      if(!App.get('auth.isAuthenticated')) return false;
      if(data.message){
        // we.messenger.publicRoom.messages.push(data.message);
        we.events.trigger('weMessengerPublicMessageReceived', data.message);
      }
    });

    /**
     * Message receved after a contact connect
     * @param  object data
     */
    socket.on('contact:connect', function(data) {
      if(!App.get('auth.isAuthenticated')) return false;
      var contact = data.item;

      if(App.currentUser.id !== contact.id){
        // set default values for every contact
        if(!contact.messages){
          contact.messages = [];
        }
        if(!contact.messengerBox){
          contact.messengerBox = {};
        }
        we.events.trigger('we-messenger-contact-connected', contact);
      }
    });

    /**
     * Message receveid after a contact disconect
     * @param  object data
     */
    socket.on('contact:disconnect', function(data) {
      if(!App.get('auth.isAuthenticated')) return false;
      if(data.contact && data.contact.id){
        we.events.trigger('we-messenger-contact-diconnected', data.contact);
      }
    });
  }
});
