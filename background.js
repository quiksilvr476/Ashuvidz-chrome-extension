
class Utils
{
    static getLocalStorage(keys)
    {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(keys, (result) => {
                resolve(result);
            });
        });
    }
    static setLocalStorage(data)
    {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(data, () => {
                resolve();
            });
        });
    }
}

class TwitchNotifier
{
    constructor(twitchApiKey, twitchUserName)
    {
        this.twitchApiKey = twitchApiKey;
        this.twitchUserName = twitchUserName;
        this.localStorage = {};

        this.twitchUrl = `https://api.twitch.tv/helix/streams?user_login=${this.twitchUserName}`;
        this.twitchApiGetter = {
            method: 'GET',
            headers: {"Client-ID": this.twitchApiKey}
        };
    }

    async init()
    {
        this.localStorage = await Utils.getLocalStorage();

        if (!this.localStorage.linkUrl || !this.localStorage.isLive) {
            this.localStorage = {
                linkUrl: `https://youtube.com/${this.twitchUserName}/`,
                isLive: false,
            };
        }

        // CRON for webextensions
        chrome.alarms.create('twitchAlarm', {delayInMinutes: 1, periodInMinutes: 1});
        chrome.alarms.onAlarm.addListener(async () => {
            await this.update();
        });

        // When notification is clicked
        chrome.notifications.onClicked.addListener(() => {
            chrome.tabs.create({url: this.localStorage.linkUrl});
        });
        // When plugin icon is clicked
        chrome.browserAction.onClicked.addListener(() => {
            chrome.tabs.create({url: this.localStorage.linkUrl});
        });

        await this.update();
    }

    async update()
    {
        await this.checkTwitch();
        await Utils.setLocalStorage(this.localStorage);

        if (this.localStorage.isLive) {
            chrome.browserAction.setIcon({path: "images/online.png"});
        } else {
            chrome.browserAction.setIcon({path: "images/offline.png"});
        }
    }

    async findGame(gameId)
    {
        const twitchGameUrl = `https://api.twitch.tv/helix/games?id=${gameId}`;

        const response = await fetch(twitchGameUrl, this.twitchApiGetter);
        if (response.status !== 200) {
            console.error('Error when fetching API Twitch', response);

            return null;
        }

        const game = await response.json();
        if (game.data.length === 0) {
            return null;
        }

        return game;
    }

    async findUser(userId)
    {
        const twitchUserUrl = `https://api.twitch.tv/helix/users?id=${userId}`;

        const response = await fetch(twitchUserUrl, this.twitchApiGetter);
        if (response.status !== 200) {
            console.error('Error when fetching API Twitch', response);

            return null;
        }

        const user = await response.json();
        if (user.data.length === 0) {
            return null;
        }

        return user;
    }

    async checkTwitch()
    {
        const response = await fetch(this.twitchUrl, this.twitchApiGetter);
        if (response.status !== 200) {
            console.error('Error when fetching API Twitch', response);
            return;
        }

        const channel = await response.json();
        if (channel.data.length === 0) {
            // twitch offline
            this.localStorage.isLive = false;

            return;
        }

        const title = channel.data[0].title;

        // twitch is live
        if (this.localStorage.isLive) {
            // already in live : prevent multiple notifications "online"
            return;
        }
        this.localStorage.isLive = true;

        const game = await this.findGame(channel.data[0].game_id);
        const gameName = game.data[0].name;

        const user = await this.findUser(channel.data[0].user_id);
        const username = user.data[0].display_name;

        await this.sendNotification(title, gameName, username, 'images/avatar.jpg');
    }

    async sendNotification(title, gameName, username, profileImageUrl)
    {
        this.localStorage.linkUrl = `https://twitch.tv/${this.twitchUserName}/`;
        chrome.notifications.create('notifTwitchOffline', {
            type: 'basic',
            title: title,
            message: `${username} est en stream sur ${gameName}`,
            iconUrl: profileImageUrl,
        });
    }
}

(new TwitchNotifier('b90nfoacg9807542cq15o2qbv2g05q', 'ashuvidz')).init();
