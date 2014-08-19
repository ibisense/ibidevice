//
// Copyright (c) 2013, Ibisense ltd.
// see file LICENSE for licensing (BSD)
//
"use strict";

global.jQuery = require('jquery');

var sys = require('sys');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var ibisense = require("../lib/ibisense.api.js");
var channelSlugs = {};
var config_file = "../etc/ibideviced_config.json";

//Configuration
var config = JSON.parse(fs.readFileSync("../etc/ibideviced_config.json"));

if (!config) {
    console.log("No configuration file was found. Exiting.");
    process.exit(-1);
}

//Init Ibisense API
ibisense.setApiKey(config.apikey);

//Logging
var log4js = require("log4js");
log4js.configure({
    "appenders": [{
        "type": "file",
        "filename": config.log_dir + '/ibideviced.log',
        "maxLogSize": 1048576,
        "backups": 3,
        "category": "ibideviced"
    }],
});

var log = log4js.getLogger("ibideviced");
log.setLevel(log4js.levels.INFO);

//Debug on / off ?
//log.setLevel(log4js.levels.TRACE)

//Here are the data collecting scripts
var collectors_path = config.collectors_dir;
if (collectors_path[collectors_path.length - 1] !== '/') {
    collectors_path = collectors_path + "/";
}

//Checks if the collector file looks runnable. TBD: check file permissions for +x
var collector_runnable = function(name) {
    //TODO: add check for executable and non-directory
    //Do not run backup files
    if (name.match(/^\.$/) || name.match(/\#/) || name.match(/~$/)) {
        return false;
    } else {
        return true;
    }
}

//Run all the collectors in the directory
var runCollectors = function() {
    try {
        var collectors = fs.readdirSync(collectors_path);
    } catch (e) {
        //TODO: add exception handling
    }

    for (var c_idx in collectors) {
        var collector = collectors[c_idx];
        log.trace(collector);
        if (collector_runnable(collector)) {
            execCollector(collectors_path + collector, null);
        }
    }
};

//Look up CUID for a measurement
//Create new channel
var createChannel = function(ts, chName, chValue) {
    var ch = new ibisense.models.Channel({
        "name": "RPi sensor " + chName,
        "description": "",
        "unit": "",
        "abbreviation": chName
    });

    log.warn("New channel: " + ch.toJsonString());
    ibisense.channels.add(config.sensorid,
        ch,
        function(newch, status) {
            //New channel created - store CUID and repost data
            log.info("Created new channel '" + newch.cuid() + "' for sensor '" + chName + "'");
            channelSlugs[chName] = newch.cuid();
            measurementReceived(ts, chName, chValue);
        },
        function() {
            //Error
            log.error("Can't create new channel " + chName);
        });;


}


//A new measurement received event
var measurementReceived = function(ts, chName, chValue) {
    var m = {
        'abs_time': ts,
        'value': chValue
    };

    //Do we already know the Ibisense Channel ?
    if (channelSlugs[chName]) {
        //If the CUID is known, send the data to Ibisense
        ibiSendMeasurement(channelSlugs[chName], m);
    } else {
        //If CUID (Channel UID) is unknown, poll for it. If not known, create channel
        //measurementUnknownCUID(chname, m);
        log.warn("Unknown CUID for " + chName);
        createChannel(ts, chName, chValue);
    }
}


// Processes results from collectors

//Process data formats like:
// T,20


// T1,20.34 °C
// T2,34.22 °C

// V1,12.00V
// RH,34 %

// Use * to denote measurement timestamp if it is not current:
// *02:03:00,T,20
// *02:03:01,T,20

//Currently supported formats:
//No timestamp:
//  ChannelName ChannelValue
//  ChannelName,ChannelValue
//With timestamp:
//  Timestamp,ChannelName,ChannelValue
//  Timestamp ChannelName ChannelValue

var processCollectorResult = function(path, lines) {
    lines.forEach(function(line) {
        //Try to split the line by comma
        var lineItems = line.replace(/^\s+|\s+$/g, '').split(/\s+|\,/);
        var ts = new Date(),
            chName, chValue;
        var skip = false;
        log.trace("Received new measurement: " + line);
        if (lineItems.length == 2) {
            //we have exactly 2 items after splitting,
            //this indicates that there is only a channel name and value
            try {
                chName = lineItems[0];
                chValue = parseFloat(lineItems[1]);
                if (isNaN(chValue)) throw new Error("Unparsable floating point value");
            } catch (e) {
                //Error in timestamp
                log.error(path + " Could not parse value " + e);
                skip = true;
            }
        } else if (lineItems.length == 3) {
            //we have exactly 3 items after splitting,
            //this indicates that there is a timestamp, channel name and value
            try {
                if (!isNaN(parseInt(lineItems[0]))) {
                    ts = new Date(parseInt(lineItems[0]));
                } else {
                    ts = Date.parse(lineItems[0]);
                }
                chName = lineItems[1];
                chValue = parseFloat(lineItems[2]);
                if (isNaN(ts.getTime())) throw new Error("Unparsable date");
                if (isNaN(chValue)) throw new Error("Unparsable floating point value");
            } catch (e) {
                log.error(e);
                skip = true;
            }
        } else {
            //well we have got something weird, so skip it
            log.error("Got unparsable string, skipping. Faulty string is " + line);
            skip = true;
        }
        if (!skip) measurementReceived(ts, chName, chValue);
    });
}

//Execute collector and pipe results
var execCollector = function(path, sink) {
    var running = true;
    var stdout_data = [];
    log.trace("Starting " + path);

    //try-catch block catches non-executable files and errors
    try {
        var child = spawn(path);

        child.stdout.on('data', function(data) {
            (d + '').split(/\n/).forEach(function(element) {
                stdout_data.push(element);
            });
            //Collect data from STDOUT

            log.trace("STDOUT " + stdout_data);
        });

        child.stderr.on('data', function(d) {
            log.error(path + " stderr: " + d);
        });


        child.on('close', function(code, signal) {
            running = false;
            log.trace(path + " exit: " + code + "/" + signal);
            running = false;
            if (code === 0) {
                processCollectorResult(path, stdout_data);
            } else {
                log.warn(path + " closed with code " + code);
            }
        });

        //TODO: add timeout+kill. This does not work well with node.js for some reason!
        setTimeout(function() {
            if (running) {
                child.kill("SIGTERM");
                log.warn("Sleeping process,killed " + path);
            }
        }, config.process_timeout);
    } catch (e) {
        log.error(e);
    }
};



//TODO: add data buffering if net connetion is down

// Message handling routines. slug is the same as CUID = channel UID
var ibiSendMeasurement = function(slug, m) {
    var cuid = '';

    if (typeof m.value !== "number") {
        //is it a stringed number ?
        if (!isNaN(parseFloat(m.value))) {
            //Yes, replace with parsed number
            m.value = parseFloat(m.value);
        } else {
            //Only numeric data allowed currently
            log.trace("Non-numeric measurement: " + m.value);
            return;
        }
    }

    var dp = new ibisense.models.DataPoint({
        "date": m.abs_time,
        "value": m.value
    });

    log.trace("Storing " + dp.toJsonString());


    var onError = function(status) {
        log.error("Ibisense store failed with code " + status);
    };

    var onSuccess = function(status) {
        log.trace("Ibisense store OK");
    };

    var onErrorGen = function(dpoint) {
        return function(status) {
            log.error("Ibisense store failed with code " + status + " for data " + dpoint);
        }
    }

    var onSuccessGen = function(dpoint) {
        return function(status) {
            log.trace("Stored: " + dpoint);
        };
    };

    if (typeof slug !== 'undefined' && slug && dp.toJson().t && dp.toJson().v) {
        log.trace("Storing " + slug + " = " + dp.toJsonString());
        ibisense.datapoints.add(slug, [dp],
            onSuccessGen(slug + "=" + dp.toJsonString()),
            onErrorGen(slug + "=" + dp.toJsonString()),
            null);
    } else {
        log.warn("Slug not defined for " + m.nodename);
    }
};

var startCollectors = function() {
    setInterval(
        function() {
            runCollectors();
        }, 5000
    );
};

var bootstrapDelayed = function(retries) {
    setTimeout(function() {
        bootstrap(retries)
    }, 1000);
};


var bootstrap = function(retries) {

    if (!retries) process.exit(-1);
    else retries--;

    if (config.apikey && config.sensorid) {
        ibisense.setApiKey(config.apikey);
        ibisense.sensors.get(config.sensorid,
            function(sensor) {
                console.log("OK. Sensor was  previously registered. Loading channels.")
                ibisense.channels.list(config.sensorid,
                    function(channels) {
                        for (var i in channels) {
                            var ch = channels[i];
                            log.info("Data from sensor '" + ch.abbreviation() + "' will be stored to channel '" + ch.cuid() + "'");
                            channelSlugs[ch.abbreviation()] = ch.cuid();
                        }
                        startCollectors();
                    }, function(code) {
                        log.error("Error on loading channel data from Ibisense, status=" + code);
                    }
                );
            }, function(code) {
                console.log("ERROR. Sensor was not registered (" + code + ")");
                bootstrapDelayed(retries);
            });
    } else {
        exec(config.get_mac_address_command, function(error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
                process.exit(-1); //fatal
            }

            var serial = stdout || "unknown";
            serial = serial.replace(/^\s*/, '').replace(/\s*$/, '');
            console.log("Registering device with serial number: " + serial + ".");
            if (serial === "unknown") {
                console.log("Could not retrieve device serial number");
                process.exit(-1); //fatal
            }

            // By default, use MAC address of the RPi as the registration secret
            // This is not the most secure method, but better than nothing - now
            // you can share the cpuid to others with whom you wish to share the
            // data and they won't be able to fake your data without knowing the MAC
            // address;

            exec(config.get_cpu_number_command, function(error, stdout, stderr) {

                var secret;

                if (config.secret) {
                    secret = config.secret;
                } else {
                    secret = stdout || "";
                    secret = secret.replace(/^\s*/, '').replace(/\s*$/, '');

                    if (secret === "") {
                        console.log("Using an empty secret");
                    }
                }

                log.trace("SECRET=" + secret);
                ibisense.activation.activateUnregistered({
                        'serial': serial,
                        'secret': secret
                    },
                    function(apikey, suid) {
                        console.log("Device with serial number " + serial + " was registered in the Ibisense cloud: SUID " + suid + " API KEY: " + apikey);
                        config.apikey = apikey;
                        config.sensorid = suid;
                        ibisense.setApiKey(config.apikey);
                        fs.writeFile(config_file, JSON.stringify(config, null, 4),
                            function(err) {
                                if (err) {
                                    console.log("There has been an error saving your configuration data.");
                                    console.log(err.message);
                                    bootstrapDelayed(retries);
                                }
                                console.log("Configuration saved successfully.")
                                bootstrap(retries); //startCollectors();
                            }
                        );
                    }, function(code) {
                        console.log("There was an error registering the device in Ibisense cloud. Error code : " + code);
                        bootstrapDelayed(retries);
                    }
                );
            });
        });
    }
};

// MAIN - startup

var bootstrapRetries = 10;
bootstrap(bootstrapRetries);