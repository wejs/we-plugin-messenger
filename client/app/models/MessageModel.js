$(function() {
  App.Message = DS.Model.extend({
    fromId: DS.belongsTo('user', {
      async: true
    }),

    toId: DS.belongsTo('user', {
      async: true
    }),
    roomId: DS.belongsTo('room', {
      async: true
    }),

    content: DS.attr('string'),

    status: DS.attr('string', {
      defaultValue: 'salved'
    }),

    read: DS.attr('boolean', {
      defaultValue: false
    }),

    // helper to get contact relationship
    contactId: function() {
      var auid = App.get('currentUser.id');
      if (!auid) return null;

      if (this.get('toId') == auid) {
        // public message
        return this.get('fromId');
      }

      if (this.get('fromId') == auid) {
        // public message
        return this.get('toId');
      }

      // may be a public or room message
      return this.get('fromId');
    }.property('toId', 'fromId'),

    createdAt: DS.attr('date'),
    updatedAt: DS.attr('date')
  });

  App.MessageAdapter = App.ApplicationRESTAdapter.extend();
});