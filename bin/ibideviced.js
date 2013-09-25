//
// Ibisense device data daemon
// Ibisense (c) 2013-
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
	"appenders" : [ 
		       { "type" : "file",
			       "filename" : config.log_dir+'/ibideviced.log' ,
			       "maxLogSize" : 1048576,
			       "backups" : 3,
			       "category" : "ibideviced"
			       }
			],
	    });

var log = log4js.getLogger("ibideviced"); 
log.setLevel(log4js.levels.INFO);

//Debug on / off ?
//log.setLevel(log4js.levels.TRACE)

//Here are the data collecting scripts
var collectors_path = config.collectors_dir;
if(collectors_path[collectors_path.length-1] !== '/') {
    collectors_path = collectors_path + "/";
}

//TODO: add data sinks

var collector_runnable = function(name) {
    //TODO: add check for executable and non-directory
    //Do not run backup files
    if(name.match(/^\.$/) || name.match(/\#/) || name.match(/~$/)) {
	return false;
    } else {
	return true;
    }
}

var runCollectors = function() {
    try { 
	var collectors = fs.readdirSync(collectors_path);
    } catch (e) {
	//TODO: add exception handling
    }
    
    for (var c_idx in collectors) {       
	var collector = collectors[c_idx];
	log.trace(collector);
	if(collector_runnable(collector)) {
	    execCollector(collectors_path + collector, null);
	}
    }    
};

var measurementNonexistentChannel = function(chName, m) {
    //Send new channel request
}

//Look up CUID for a measurement
//Create new channel
var createChannel = function(ts, chName, chValue) {
    var ch = new ibisense.models.Channel({
	    "name" : "RPi sensor " + chName,
	    "description" : "",
	    "unit" : "",
	    "abbreviation" : chName
	});

    log.info("New channel: " + ch.toJsonString());
    
    ibisense.channels.add(config.sensorid,
			  ch,
			  function(newch, status) {
			      //New channel created - store CUID and repost data
			      log.info("Created new channel '" + newch.cuid() + "' for sensor '" + chName + "'");
			      channelSlugs[chName] = newch.cuid();
			      measurementReceived(ts, chName, chValue);
			  }, 
			  function () {
			      //Error
			      log.error("Can't create new channel " + chName);
			  });
    ;


}


//Send measurement to Ibisense
var measurementReceived = function(ts,chName,chValue)  {
    var m = { 'abs_time' : ts,
	      'value' : chValue };
     
    if(channelSlugs[chName]) {
	//If the CUID is known, send the data to Ibisense
	ibiSendMeasurement(channelSlugs[chName], m);
    } else { 
	//If CUID is unknown, poll for it. If not known, create channel
	//measurementUnknownCUID(chname, m);
	log.warn("Unknown CUID for " + chName);
	createChannel(ts, chName, chValue);
    }
}


//Process data formats like:
// T,20


// T1,20.34 °C
// T2,34.22 °C

// V1,12.00V
// RH,34 %

// Use * to denote measurement timestamp
// *02:03:00,T,20
// *02:03:01,T,20


var processCollectorResult = function(path,data) {
    //var lines = data.split("\n");
    var lines = data;
    for (var lineno in lines) {
	var ts = null;
	var line = lines[lineno];
	var lineItems = line.split(",");
	var ts = new Date();
        log.trace("Received new measurement: " + line)
	for(var i in lineItems) {

	    //Is the first one a timestamp ?
	    if (i===0 && lineItems[i].match(/^\*/)) {
		try {
		    ts = new Date(lineItems[0].substring(1));
		} catch (e) {
		    //Error in timestamp
		log.error(path + " can't parse timestamp " + lineItems[0]);
		ts=null;
		}		
	    } else { 
		//This is a measurement, parse it
		var m, chName, chValue;
		var ll = lineItems[i];

		if(m=ll.match(/^([^,]+?)\s+([+-]?.*)/)) {
		    if(m.length >=3) {
			var chName = m[1];
			var chValue = parseFloat(m[2]);
                        log.trace("line: " + ll + ", chName: " + chName + ", chValue: " + chValue);
                        if (chName && !isNaN(chValue)) {
  	                    measurementReceived(ts,chName,chValue);
                        }
		    }
		    else {
			log.error(path + " value " + lineItems[i] + " does not contain channel name and unit");
		    }
		} else {
		    log.error("Unable to parse line " + line);
		}

	    }
		    
	}

    }
}

var execCollector = function(path, sink) {
    var running = true;
    var stdout_data=[];
    log.info("Starting " + path);
    //TODO: adddata sink

    try {
	var child = spawn(path);
	
	child.stdout.on('data', function(d) {
		//Collect data from STDOUT
		stdout_data.push(""+d);
		log.trace("STDOUT " + stdout_data);		
	    });    
	
	child.stderr.on('data', function(d) {
		log.error(path + " stderr: " + d);
	    });
	
	
	child.on('close', function(code, signal) {
		running = false;
		if(code === 0) {
		    processCollectorResult(path, stdout_data);
		} else { 
		    log.warn(path + " closed with code " + code);
		}
	    });
	
	child.on('close', function(code, signal) {
		log.trace(path + " exit: " + code + "/" + signal); running = false;
	    });
	
	//TODO: add timeout+kill
	setTimeout(function() { 
		if(running) {
		    child.kill("SIGTERM");
		    log.warn("Sleeping process,killed " + path );
		}
	    }, config.process_timeout);
    } catch (e) {
	log.error(e);
    }
};



//TODO: add data buffering if net connetion is down

// Message handling routines
var ibiSendMeasurement = function(slug, m) {
    var cuid = '';
    
    if(typeof m.value !== "number") {
	//is it a stringed number ?
	if(!isNaN(parseFloat(m.value))) {
	    //Yes, replace with parsed number
	    m.value = parseFloat(m.value); 
	} else {
	    //Only numeric data allowed currently
	    log.trace("Non-numeric measurement: " + m.value);
	    return;
	}
    }

    var dp = new ibisense.models.DataPoint({ "date": m.abs_time,
					     "value": m.value });

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

    var onSuccessGen = function (dpoint) {
	return function(status) {
	    log.trace("Stored: " + dpoint);
	};
    };

    if(typeof slug !== 'undefined' && slug && dp.toJson().t && dp.toJson().v) {
	log.trace("Storing " + slug + " = " + dp.toJsonString());
	ibisense.datapoints.add(slug, 
				[dp], 
				onSuccessGen(slug + "=" +dp.toJsonString()), 
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

var bootstrapDelayed = function(retries){
    setTimeout(function() { bootstrap(retries) }, 1000);
};


var bootstrap = function(retries) {

    if(!retries) process.exit(-1);
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
		exec(config.get_mac_address_command, function (error, stdout, stderr) {
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

			exec(config.get_cpu_number_command, function (error, stdout, stderr) {
		
				var secret;

				if(config.secret) {
			    	secret = config.secret;
				} else {
			    	secret = stdout || "";
					secret = secret.replace(/^\s*/, '').replace(/\s*$/, '');
					console.log(": " + secret + ".");
					if (secret === "") {
		    			console.log("Using an empty secret");
					}
				}

				log.trace("SECRET=" + secret);
				ibisense.activation.activateUnregistered({ 
					'serial': serial, 
					'secret': secret},
		    		function(apikey, suid) {
						console.log("Device with serial number " + serial + " was registered in the Ibisense cloud: SUID " + suid + " API KEY: " + apikey);
						config.apikey   = apikey;
						config.sensorid = suid;
						ibisense.setApiKey(config.apikey);
						fs.writeFile(config_file, JSON.stringify(config, null, 4),
					    	 function (err) {
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

