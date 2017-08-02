'use strict';

if (!process.env.API_KEY) {
    throw new Error('API_KEY is required');
}

const Influx = require('influx');
const request = require('request-promise');

const checkInterval = process.env.UPDATE_INTERVAL_MS || 1000 * 60 * 60 * 12;

const influxClient = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST || 'localhost',
    port: process.env.INFLUX_PORT || 8086,
    protocol: process.env.INFLUX_PROTOCOL || 'http',
    database: process.env.INFLUX_DB || 'bf1stats',
    username: process.env.INFLUX_USER || '',
    password: process.env.INFLUX_PASS || ''
});

const API_KEY = process.env.API_KEY || '';
const PLATFORM = process.env.PLATFORM || 2;
const DISPLAYNAME = process.env.DISPLAYNAME || 'mattvantassel';

let statsRequestObj = {
    method: 'POST',
    url: 'https://battlefieldtracker.com/bf1/api/Stats/BasicStats',
    json: true,
    gzip: true,
    resolveWithFullResponse: true,
    headers: {
        'TRN-Api-Key': API_KEY
    },
    qs: {
        platform: PLATFORM,
        displayName: DISPLAYNAME
    }
};

function getBasicStats() {
    log(`${new Date()}: Getting Basic Stats`);

    return request(statsRequestObj);
}

function getDetailedStats() {
    log(`${new Date()}: Getting Detailed Stats`);

    return request(Object.assign(statsRequestObj, {
        url: 'https://battlefieldtracker.com/bf1/api/Stats/DetailedStats'
    }));
}

function onGetBasicStats(response) {
    log(`${new Date()}: Parsing Basic Stats`);

    let stats = response.body.result;

    if (!stats.rank) {
        stats.rank = {
            number: 0
        }
    }

    let kdr = stats.kills / stats.deaths;
    let rankImageUrl = `https://battlefieldtracker.com/Images/bf1/ranks/${stats.rank.number}.png`;

    let value = {
        kills: stats.kills,
        deaths: stats.deaths,
        kdr: kdr,
        kpm: stats.kpm,
        wins: stats.wins,
        losses: stats.losses,
        skill: stats.skill,
        spm: stats.spm,
        timePlayed: stats.timePlayed,
        rank: stats.rank.number,
        rankUrl: rankImageUrl
    };

    writeToInflux('stats', value).then(function() {
        console.dir(`wrote BasicStats data to influx: ${new Date()}`);
    });
}

function onGetDetailedStats(response) {
    log(`${new Date()}: Parsing Detailed Stats`);

    let stats = response.body.result;

    let value = {
        accuracyRatio: stats.accuracyRatio,
        avengerKills: stats.avengerKills,
        awardScore: stats.awardScore,
        bonusScore: stats.bonusScore,
        dogtagsTaken: stats.dogtagsTaken,
        flagsCaptured: stats.flagsCaptured,
        flagsDefended: stats.flagsDefended,
        headShots: stats.headShots,
        highestKillStreak: stats.highestKillStreak,
        killAssists: stats.killAssists,
        longestHeadShot: stats.longestHeadShot,
        nemesisKills: stats.nemesisKills,
        nemesisKillStreak: stats.nemesisKillStreak,
        saviorKills: stats.saviorKills,
        squadScore: stats.squadScore,
        suppressionAssist: stats.suppressionAssist
    };

    stats.kitStats.forEach(kit => {
        let value = {
            name: kit.name,
            prettyName: kit.prettyName,
            kills: kit.kills,
            score: kit.score,
            secondsAs: kit.secondsAs
        };

        let tags = {
            gameMode: kit.name
        };

        writeToInflux('kit', value, tags).then(function() {
            console.dir(`wrote ${value.name} data to influx: ${new Date()}`);
        });
    });

    stats.gameModeStats.forEach(gameMode => {
        let value = {
            name: gameMode.name,
            prettyName: gameMode.prettyName,
            score: gameMode.score,
            losses: gameMode.losses,
            wins: gameMode.wins,
            winLossRatio: gameMode.winLossRatio
        };

        let tags = {
            gameMode: gameMode.name
        };

        writeToInflux('gameMode', value, tags).then(function() {
            console.dir(`wrote ${value.name} data to influx: ${new Date()}`);
        });
    });

    writeToInflux('stats', value).then(function() {
        console.dir(`wrote DetailedStats data to influx: ${new Date()}`);
    });
}

function writeToInflux(seriesName, values, tags) {
    return influxClient.writeMeasurement(seriesName, [
        {
            fields: values,
            tags: tags
        }
    ]);
}

function log(message) {
    console.log(message);
}

function handleError(err) {
    log(`${new Date()}: Error`);
    log(err);
}

function restart(err) {
    if (err) {
        console.log(err);
    }

    // Every {checkInterval} seconds
    setTimeout(getAllTheStats, checkInterval);
}

function getAllTheStats() {
    getBasicStats()
        .then(onGetBasicStats)
        .then(getDetailedStats)
        .then(onGetDetailedStats)
        .catch(handleError)
        .finally(restart);
}

log(`${new Date()}: Initialize BF12Influx`);
getAllTheStats();
