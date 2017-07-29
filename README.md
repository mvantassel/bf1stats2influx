# deluge2influx
Pipe Battlefield1 metrics to InfluxDB from https://battlefieldtracker.com/

Most basic form:

    docker run -d mvantassel/bf1stats2influx


# Configuration (ENV, -e)

Variable | Description | Default value | Sample value | Required?
-------- | ----------- | ------------- | ------------ | ---------
INFLUX_PROTOCOL | Is Influx SSL? | http | https | optional
INFLUX_HOST | Where is your InfluxDB running? | localhost | influxdb | recommended
INFLUX_PORT | What port is InfluxDB running on? | 8086 | 999 | optional
INFLUX_DB | What InfluxDB database do you want to use? | 'bf1stats' | 'potato' | required
INFLUX_USER | InfluxDB username | | | optional
INFLUX_PASS | InfluxDB password | metrics | | optional
API_KEY | https://battlefieldtracker.com/site-api API KEY | '' | 1000 | optional
PLATFORM | 1 for Xbox, 2 for PlayStation, and 3 for Origin | 2 | 1000 | optional
DISPLAYNAME | This value identifies the player you're trying to get data for | 'mattvantassel' | 1000 | optional
UPDATE_INTERVAL_MS | How often should it check for new metrics? | 43200000 | 1000 | optional

## Tags

- latest
