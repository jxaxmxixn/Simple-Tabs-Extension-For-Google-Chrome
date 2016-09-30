senttest = function(){

	chrome.runtime.sendRequest({ 'questions': 'vagina' }, function() {});
	}
	
	setInterval(senttest, 10000);