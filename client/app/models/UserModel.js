$(function() {
	App.User.reopen({
	  messengerStatus: DS.attr("string", {
	    defaultValue: "offline"
	  }),
	  isTalking: DS.attr("string", {
	    defaultValue: false
	  })
	});
});