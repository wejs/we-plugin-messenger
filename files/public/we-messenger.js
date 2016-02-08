
(function (we) {

window.weMessenger = {
  contacts: {},
  user: null,

  users: {},

  defaultOptions: {
    avatarHost: location.origin,
    messengerHost: location.origin,
    delayToStart: 200
  },

  element: null,

  parentDomain: 'http://localhost:3000',
  initialize: function(options) {
    if (!window.currentUser) return;
    this.options = $.extend(this.defaultOptions, options);

    this.user = window.currentUser;
    this.users[this.user.id] = this.user;
    var self = this;

    var socket= we.socket;

    this.element = $('#privateChat');

    socket.on('messenger:private:message:created', function(data) {

    });

    socket.on('contact:connect', function(data) {
      self.setUserAsOnline(data.id);
    })
    socket.on('contact:disconnect', function(data) {
      self.setUserAsOffline(data.id);
    })

    socket.on('connect', function() {
      socket.emit('messenger:start:list');
    });

    $('.public-room-area').click(function(){
      self.openPublicBox();
    });

    this.socket = socket;

    $.getJSON( '/contact' )
    .done(function afterLoadCurrentUser(data) {
      console.log('contacts', data);

      if (data.meta.users) {
        data.meta.users.forEach(function(user) {
          self.users[user.id] = user;
        });
      }

      if (data.contact) {
        data.contact.forEach(function(contact){
          self.addContact(contact);
        })
      }

      setTimeout(function(){
        $('body').removeClass('is-starting');
       }, self.options.delayToStart);
    })
    .fail(function(data) {
      console.error(data);
    });
  },

  openPublicBox: function() {
    parent.postMessage('open_public_box', this.parentDomain);
  },

  openPrivateBox: function(contactId) {
    parent.postMessage('open_private_box_' + contactId, this.parentDomain);
  },

  getContactId: function(contact) {
    if (contact.to == this.user.id) return contact.from;
    return contact.to;
  },

  addContact: function(contact) {
    if (!contact.contactId) contact.contactId = this.getContactId(contact);
    if (!contact.avatarUrl)
      contact.avatarUrl = this.options.avatarHost + '/avatar/'+contact.contactId+'?style=thumbnail';
    contact.relatedUser = this.users[contact.contactId];
    this.contacts[contact.contactId] = contact;
    this.renderContact(contact);
  },

  setUserAsOffline: function(userId) {
    if (this.contacts[userId]) {
      this.contacts[userId].isOnline = false;
      this.element.find('#messenger-private-'+userId).attr('class','is-offline');
    }
  },
  setUserAsOnline: function(userId) {
    if (this.contacts[userId]) {
      this.contacts[userId].isOnline = true;
      this.element.find('#messenger-private-'+userId).attr('class','is-online');
    }
  },

  renderContact: function(contact) {
    var isOnlineClass = null;
    if (contact.isOnline) isOnlineClass = 'is-online';

    this.element.find('.chat-contacts').append(
      '<li id="messenger-private-'+contact.contactId+'" class="'+isOnlineClass+'">'+
        '<a href="javascript:weMessenger.openPrivateBox('+contact.contactId+');">'+
          '<img class="user-avatar" src="'+ contact.avatarUrl +'">'+
          contact.relatedUser.displayName +
        '</a>'+
      '</li>'
    );


  }
};

// Every two seconds....
// setInterval(function() {
//   // Send the message "Hello" to the parent window
//   // ...if the domain is still "davidwalsh.name"
//   parent.postMessage("Hello","http://localhost:3000");
// },1000);

// /**
//  * Add Accept in all request
//  *
//  */
// $.ajaxPrefilter(function( options ) {
//   if ( !options.beforeSend) {
//     options.beforeSend = function (xhr) {
//       xhr.setRequestHeader('Accept', 'application/json');

//       // set auth token
//       if ($.cookie('weoauth')) xhr.setRequestHeader('Authorization','Bearer ' + $.cookie('weoauth'));
//     };
//   }
// });

// window.moment.locale('{{locale}}');

// window.currentUser = {{{currentUserJsonRecord}}};
// window.contact = {{{jsonRecord}}};



})(window.we);