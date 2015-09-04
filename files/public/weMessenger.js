window.weMessengerList = {
  defaultOptions: {
    loadingDelay: 500,
    weMessengerTag: 'weMessengerTag',
    origin: location.origin,
    messengerHost: location.origin
  },

  listWidth: 275,

  boxHeight: 360,
  boxWidth: 270,

  mBoxHeight: 35,

  url: null,
  element: null,

  openPrivateBoxes: {},
  openRoomBoxes: {},

  initialize: function (options) {
    this.options = $.extend(this.defaultOptions, options);
    this.element = $('#' + this.options.weMessengerTag);

    if (!this.element || !this.element)
      throw new Error('We messenger tag not found:', this.options.weMessengerTag);

    this.url = this.options.messengerHost + '/widget/messenger/list/';
    setTimeout(this.loadMessenger.bind(this), this.options.loadingDelay);
  },

  loadMessenger: function() {
    var self = this;
    // Create IE + others compatible event handler
    var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

    // Listen to message from child window
    eventer(messageEvent, function(e) {
      if (self.options.messengerHost !== e.origin) return;
      if (typeof e.data !== 'string') return;
      var userId;

      if ( e.data.startsWith('open_private_box_') ) {
        userId = e.data.replace('open_private_box_', '');
        if (!Number(userId)) return;

        if (!self.openPrivateBoxes[userId]) {
          self.openPrivateBox(userId);
        } else {
          self.sendMaximize(userId);
          self.focusPrivateBox(userId);
        }
      } else if( e.data.startsWith('close_private_box_')) {
        userId = e.data.replace('close_private_box_', '');
        if (!Number(userId)) return;

        if (self.openPrivateBoxes[userId]) {
          self.closePrivateBox(userId);
        }
      } else if( e.data.startsWith('minimize_private_box_')) {
        userId = e.data.replace('minimize_private_box_', '');
        if (!Number(userId)) return;

        if (self.openPrivateBoxes[userId]) {
          self.minimizePrivateBox(userId);
        }
      } else if( e.data.startsWith('maximize_private_box_')) {
        userId = e.data.replace('maximize_private_box_', '');
        if (!Number(userId)) return;

        if (self.openPrivateBoxes[userId]) {
          self.maximizePrivateBox(userId);
        }
      } else if (e.data === 'open_public_box') {
        self.openPublicBox()
      }
    },false);

    this.renderMessengerArea();
  },

  openPublicBox: function() {
    if (this.openRoomBoxes.public) return;
    this.renderRoomBox();
    this.openRoomBoxes.public = true;
    this.focusRoomBox();
  },

  openPrivateBox: function(userId) {
    this.renderContactBox(userId);
    this.openPrivateBoxes[userId] = true;
    this.focusPrivateBox(userId);
  },
  closePrivateBox: function(userId) {
    $('#messenger-private-'+ userId).remove();
    this.openPrivateBoxes[userId] = false;
  },
  minimizePrivateBox: function(userId) {
    $('#messenger-private-'+ userId + ' > .messenger-box').height(this.mBoxHeight + 'px');
    $('#messenger-private-iframe-'+userId).height(this.mBoxHeight + 'px');
  },
  maximizePrivateBox: function(userId) {
    $('#messenger-private-'+ userId + ' > .messenger-box').height(this.boxHeight + 'px');
    $('#messenger-private-iframe-'+userId).height(this.boxHeight + 'px');
  },

  sendMaximize: function(userId) {
    var iframe = window.frames['messenger-private-iframe-' + userId];
    if (iframe) {
      iframe.contentWindow.postMessage('maximize_private_box_' + userId, this.options.messengerHost);
    }
  },

  focusPrivateBox: function(contactId) {
    window.frames['messenger-private-iframe-' + contactId].focus();
  },

  updateSizes: function() {

  },

  renderMessengerArea: function() {
    var listBoxWidth = $( window ).width() - this.listWidth;
    var listBoxStyle = 'width: '+ listBoxWidth +'px; height: '+$( window ).height()+'px';
    var listContactStyle = 'height: '+this.boxHeight+'px; width:'+this.boxWidth+'px;';

    this.element.html(
    '<div class="messenger-zone-wrapper">'+
      '<div class="messenger-zone">'+
        '<div class="messenger-box-list" style="'+ listBoxStyle +'"></div>'+
        '<div class="messenger-contact-list-area"  style="width: '+ this.listWidth +'px;" >'+
          '<iframe src="'+ this.url +'?height='+this.boxHeight+
          '" style="'+listContactStyle+';position:fixed;bottom:0px;" frameborder="0"></iframe>'+
        '</div>'+
      '</div>'+
    '</div>'
    );
  },

  renderRoomBox: function(roomId) {
    if (!roomId) roomId = 'public';

    this.element.find('.messenger-box-list').append(
    '<div id="messenger-room-'+roomId+'" tabindex="0" class="messenger-box-wrapper">'+
      '<div class="messenger-box">'+
        '<iframe id="messenger-room-iframe-'+roomId+'" src="/widget/messenger/room/'+ roomId +
          '" width="'+this.boxWidth+'px" frameborder="0"></iframe>'+
      '</div>'+
    '</div>'
    );

    this.maximizeRoomBox(roomId);
  },

  renderContactBox: function(contactId) {
    this.element.find('.messenger-box-list').append(
    '<div id="messenger-private-'+contactId+'" tabindex="0" class="messenger-box-wrapper">'+
      '<div class="messenger-box">'+
        '<iframe id="messenger-private-iframe-'+contactId+'" src="/widget/messenger/private/'+ contactId +
          '" width="'+this.boxWidth+'px" frameborder="0"></iframe>'+
      '</div>'+
    '</div>'
    );

    this.maximizePrivateBox(contactId);
  }
}
