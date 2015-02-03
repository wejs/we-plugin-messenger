// TODO agroup messages
// App.MessengerMessageView = Ember.View.extend({

//   attributeBindings: ['userId:data-user-id'],

//   userId: function() {
//     return this.get('controller').model.get('fromId.id');
//   }.property('controller'),

//   showAvatar: true,
//   didInsertElement: function() {
//     if (this.element.previousElementSibling) {
//       var fromId = this.get('controller').model.get('fromId.id');
//       var lastMessageFromId = this.element.previousElementSibling.dataset.userId;
//       if (fromId == lastMessageFromId) this.set('showAvatar', false);
//     }

//   }
// });