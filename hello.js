
var currentMedia = null;
var currentContentType = null;
var currentSession = null;

var debug = function(msg) {
	console.log(arguments);
	if (arguments.length > 1) {
		args = Array.prototype.slice.call(arguments, 1);
		msg = msg + ": " + JSON.stringify(args);
	}
	document.getElementById('messages').textContent += msg + "\n";
};

var loadMedia = function(src, contentType) {
	debug('loading media', src, contentType);
	currentMedia = src;
	currentContentType = contentType;
	if (currentSession) {
		var mediaInfo = new chrome.cast.media.MediaInfo(currentMedia);
		mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
		mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
		mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
		mediaInfo.contentType = contentType;

		var request = new chrome.cast.media.LoadRequest(mediaInfo);
		request.autoplay = true;
		request.currentTime = 0;
		currentSession.loadMedia(request, debug.bind(this, 'loadMediaSuccess'), debug.bind(this, 'loadMediaError'));
	}
};

var launchApp = function() {
	debug('Launching app...');
	chrome.cast.requestSession(sessionListener, debug.bind(this, 'requestSession'));
};

var stopApp = function() {
	if (!currentSession) {
		return debug('no session found');
	}
	debug('Stopping app...');
	currentSession.stop(debug.bind(this, 'stopSessionSuccess'), debug.bind(this, 'stopSessionError'));
};

var sessionListener = function(session) {
	debug('New session ID', session.sessionId);
	currentSession = session;
	session.addUpdateListener(function(isAlive) {
		if (!isAlive) {
			debug('Session died');
			currentSession = null;
		}
	});
	if (currentMedia) {
		loadMedia(currentMedia, currentContentType);
	}
};

// Initialize cast API
window['__onGCastApiAvailable'] = function(isAvailable) {
	if (isAvailable) {
		debug('Initializing');
		var appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
		var autoJoinPolicy = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;

		var sessionRequest = new chrome.cast.SessionRequest(appId);
		var apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, debug.bind(this, 'receiverListener'), autoJoinPolicy);
		chrome.cast.initialize(apiConfig, debug.bind(this, 'onInitSuccess'), debug.bind(this, 'onInitError'));
		debug('Finished initializing');
	}
};

