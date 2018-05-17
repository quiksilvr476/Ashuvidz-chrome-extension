(
    () => {

        // Error Manager
        function onError (errorMessage){
            console.log(errorMessage);
        }

        // Bootstraps the plugin.
        function linkManager(item) {
            if (!item) {
                chrome.storage.local.set({
                    linkUrl:  `https://youtube.com/${twitchUserName}/`,
                    isLive: "0"
                });
                local = item;
                linkManager();
            } else {
                local = item;
                console.log(local);
                twitchCheck();
            }
        }

        // This is the actual logic of the plugin.
        function twitchCheck(){

            // We first get data from Twitch Using Helix API using new nodejs fetch methode
            // Setting the API Request to Twitch
            const twitchUrl = `https://api.twitch.tv/helix/streams?user_login=${twitchUserName}`;


            const twitchApiGetter = {
                method: 'GET',
                headers: { "Client-ID": twitchApiKey }
            };

            // Fetching data from twitch API
            fetch(twitchUrl, twitchApiGetter).then(( response ) => {
                return response.json()}).then((channel) => {
                    //live is offline Youtube player appened
                    if (channel.data.length <= 0) {

                        // If status changed, change status back to not streaming and save it in local storage without notifications.
                        chrome.browserAction.setIcon({path: "images/offline.png"});

                        // If status didn't changed do Nothing
                        if (local.isLive === '0') return;

                        chrome.storage.local.set({
                            isLive:  "0",
                            linkUrl: `https://youtube.com/${twitchUserName}/`
                        }, () => {
                            buffer = chrome.storage.local.get(["isLive", "linkUrl"], () => {
                                linkManager();
                            });
                        });

                    } else {

                        // If live, append the link to Twitch and change images
                        chrome.browserAction.setIcon({path: "images/online.png"});

                        if (local.isLive === '1') return;

                        const twitchGameUrl = 'https://api.twitch.tv/helix/games?id=' + channel.data[0].game_id;

                        fetch(twitchGameUrl, twitchApiGetter).then(( response ) => {
                            return response.json()}).then( (game)=> {

                           if (game.data.length <= 0) {
                               return;
                           }

                            let twitchGameName = game.data[0].name;
                            const twitchUserUrl = 'https://api.twitch.tv/helix/users?login=' + twitchUserName;

                            fetch(twitchUserUrl, twitchApiGetter).then(( response ) => {
                                return response.json()}).then( (user)=> {

                                if (user.data.length <= 0) {
                                    return;
                                }
                                // This sends a notification

                                console.log(user.data[0].profile_image_url);

                                chrome.notifications.create('notifTwitchOffline', {
                                    'type': 'basic',
                                    'title': channel.data[0].title,
                                    'message': `${twitchUserName} est en stream sur ${twitchGameName}`,
                                    'iconUrl': user.data[0].profile_image_url
                                });

                                // Then update the local variable and get it again to ensure the promise is fired.
                                chrome.storage.local.set({
                                    isLive: "1",
                                    linkUrl: `http://twitch.tv/${twitchUserName}/`
                                });
                                buffer = new Promise(
                                    (resolve, reject) => {
                                        chrome.storage.local.get(['isLive', 'linkUrl'], (result) => {
                                            if (result){
                                                resolve(result)
                                            } else {
                                                reject(result)
                                            }
                                        })}
                                );
                                buffer.then(linkManager, onError);
                            })
                        });
                    }
                }
            );
        }

        const twitchApiKey = "b90nfoacg9807542cq15o2qbv2g05q";
        const twitchUserName = "twerk17";

        // This starts the plugin by geeting the saved previous status if any.
        let local;

        // This function create the promise
        let buffer = new Promise(
            (resolve, reject) => {
            chrome.storage.local.get(['isLive', 'linkUrl'], (result) => {
                if (result){
                    resolve(result)
                } else {
                    reject(result)
                }
            })}
        );

        buffer.then(linkManager, onError);

        // Borwser Event Listeners. This keep application running after bootstrap.
        // This create the delay that trigger a new check every minutes
        chrome.alarms.create('twitchAlarm', {delayInMinutes: 1, periodInMinutes: 1});

        // This manage the behavior when an Alarm Event is Fired
        chrome.alarms.onAlarm.addListener(() => {
            buffer.then(twitchCheck);
        });

        // This manager the behavior when plugin icon is clicked
        chrome.browserAction.onClicked.addListener(() =>
        {
            chrome.tabs.create({ url: local.linkUrl });
        });

        // This manage the onclick behavior over the notification.
        chrome.notifications.onClicked.addListener(() => {
            chrome.tabs.create({ url: local.linkUrl });
        });

        /*function increment() {
            chrome.browserAction.setBadgeText({text: (13).toString()});
        }

        increment()*/
    }
)();