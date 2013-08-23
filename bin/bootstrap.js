"use strict";

global.jQuery = require('jquery');

var sys = require('sys');
var fs = require('fs');

var exec = require('child_process').exec;

var ibisense = require("../lib/ibisense.api.js");
var config_file = "../etc/ibideviced_config.json";
var config = JSON.parse(fs.readFileSync(config_file));

if (!config) {
    console.log("No configuration file was found. Exiting.");
    process.exit(-1);
}

if (config.apikey && config.sensorid) {
    ibisense.setApiKey(config.apikey);
    ibisense.sensors.get(config.sensorid, 
        function(sensor) {
            console.log("OK. Sensor was  previously registered.")
            process.exit(0);
        }, function(code) {
            console.log("ERROR. Sensor was not registered, but ID exists. Please clear apikey and sensorid in config file and run again!")
            process.exit(-1);
        }
    );
} else {
    exec(config.get_serial_number_command, function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
            process.exit(-1);
        }

        var serial = stdout || "unknown";
        serial = serial.replace(/^\s*/, '').replace(/\s*$/, '');
        console.log("Registering device with serial number: " + serial + ".");
        if (serial === "unknown") {
            console.log("Could not retrieve device serial number");
            process.exit(-1);
        }

        ibisense.activation.activateUnregistered(serial,
            function(apikey, suid) {
                console.log("Device with serial number " + serial + " was registered in the Ibisense cloud: SUID " + suid + " API KEY: " + apikey);
                config.apikey   = apikey;
                config.sensorid = suid;
                fs.writeFile(config_file, JSON.stringify(config, null, 4),
                    function (err) {
                        if (err) {
                            console.log("There has been an error saving your configuration data.");
                            console.log(err.message);
                            process.exit(-1);
                        }
                        console.log("Configuration saved successfully.")
                        process.exit(0);
                   }
                );
            }, function(code) {
                console.log("There was an error registering the device in Ibisense cloud. Error code : " + code);
                process.exit(-1);
            }
        ); 
    });
}

