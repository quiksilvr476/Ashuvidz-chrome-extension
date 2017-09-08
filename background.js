
function twitchCheck(){$.getJSON("https://api.twitch.tv/kraken/streams/Ashuvidz?client_id=yufsibfdh5gwli5nzdj01ceghc1ubv", function(channel) {
  //live is offline Youtube player appened
  if (channel["stream"] == null) {
    console.log("Stream is offline");

    linkUrl = "http://youtube.com/ashuvidz/";
    chrome.browserAction.setIcon({path: "images/offline.png"});
    console.log("set icon offline");

    //live is online Twitch player
  } else {
      linkUrl = "http://twitch.tv/ashuvidz/";
      chrome.browserAction.setIcon({path: "images/online.png"});
      console.log("set icon online");
    }
})};
var linkUrl = "";
twitchCheck();

chrome.alarms.create('twitchAlarm', {delayInMinutes: 5, periodInMinutes: 5});

chrome.alarms.onAlarm.addListener(function( twitchAlarm ) {
  twitchCheck();
});

chrome.browserAction.onClicked.addListener(function(activeTab)
{
    var newURL = linkUrl;
    chrome.tabs.create({ url: newURL });
});
