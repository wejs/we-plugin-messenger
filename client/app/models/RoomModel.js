$(function() {
	App.Room = DS.Model.extend({
	  creator_id: DS.attr('string'),
	  members_id: DS.attr('array'),

	  name: DS.attr('string'),
	  description: DS.attr('string'),

	  createdAt: DS.attr('date'),
	  updatedAt: DS.attr('date')
	});
});
