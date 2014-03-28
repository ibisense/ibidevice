//-------------------------------//
//    Ibisense JS API library    //
//        version 1.3.7          //
//     (c) 2013 Ibisense Oy      //
//-------------------------------//
//mikko was here


/**
* @ignore
*/
var ibisense = (function () {
    "use strict";

    var ApiKey,
        ApiBaseURL = "https://ibi.io/v1/",
        api,

        contains = function(arr, val) {
          var i, l = arr.length;
          for (i = 0; i < l; i++)
          {
            if (arr[i] === val) return true;
          }
          return false;
        },

        forEach = function(arr, cb) {
            for(var i = 0, len = arr.length; i < len; ++i) {
              if (i in arr) {
                cb.call(void 0, arr[i], i, arr);
              }
            }
        },

        

        log = function (msg) {
            try {
                if (window)
                    window.console.log(msg);
                else 
                    console.log(msg);
            } catch(err) { throw err; }
        },
        
        jsonGet = function (url, data, success, failure, always, method) {
            var params = '';

            for (var key in data) {
                params += ((params || 
                url.indexOf("?") != -1)?'&':'?')+key+'='+data[key];
            }

            if (((typeof navigator) != "undefined")&&navigator.userAgent && navigator.userAgent.indexOf("MSIE") != -1 && 
                window.XDomainRequest) {
                var xdr = new XDomainRequest();
                xdr.open("GET", url+params);
                
                xdr.timeout = 20000;

                /*Really important, otherwise request will hang pending */                
                xdr.onprogress = function() {}

                xdr.onload = function() {
                    if (success) {
                        var data = {};
                        var status = 200;
                        try {
                            var jsonObj = JSON.parse(xdr.responseText);
                            data = jsonObj.data || {};
                            status = jsonObj.status;
                        } catch (err) {

                        } finally {
                            if(success) success(data, status);
                            if(always) always();
                        }
                    }
                }

                xdr.onerror = function(){
                    var status = 500;
                    try {
                        var jsonObj = JSON.parse(xdr.responseText);
                        status = jsonObj.status;
                    } catch(err) {
                        console.log(err);
                    } finally {
                        if (failure) failure(status);
                        if(always) always();
                    }
                }

                xdr.ontimeout = function() {
                    if (failure) failure(500);
                    if(always) always();
                }
                
                xdr.send();
                
            } else {

                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url + params, true);
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState==4) {
                            if (xhr.status==200 || xhr.status==201) {
                                if (success) {
                                    var jsonObj = JSON.parse(xhr.responseText);
                                    success(jsonObj.data, xhr.status);
                                }
                            } else {
                                console.log(xhr.responseText);
                                if (failure) failure(xhr.status);
                            }
                            if (always) always();
                        }
                    }
                    xhr.send();
                } catch(e) {
                    throw e;
                }
            }
        },
        
        jsonPost = function (url, data, success, failure, always, method) {
           if (((typeof navigator) != "undefined")&&navigator.userAgent && navigator.userAgent.indexOf("MSIE") != -1 && 
                    window.XDomainRequest) {
                var xdr = new XDomainRequest();
                xdr.open("POST", url);
                xdr.onload = function() {
                    if (success) {
                        var data = {};
                        var status = 200;

                        try {
                            var jsonObj = JSON.parse(xdr.responseText);
                            data = jsonObj.data || {};
                            status = jsonObj.status;
                        } catch (e) {
                            throw e;
                        } finally {
                            if(success) success(data, status);
                            if(always) always();
                        }
                    }
                }
                
                xdr.timeout = 20000;

                xdr.onprogress = function () {}

                xdr.onerror = function() {
                    var status = 0;
                    try {
                        var jsonObj = JSON.parse(xdr.responseText);
                        status = jsonObj.status;
                    } catch(err) {
                        throw err;
                    } finally {
                        if (failure) failure(status);
                        if(always) always();
                    }
                }
                xdr.ontimeout = function() {
                    if (failure) failure(500);
                    if(always) always();
                }
                
                xdr.send(data);
            } else {

                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", url, true);
                    
                    xhr.setRequestHeader("Content-type", "application/json");
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState==4) {
                            if (xhr.status==200 || xhr.status==201) {
                                if (success) {
                                    var jsonObj = JSON.parse(xhr.responseText);
                                    success(jsonObj.data, xhr.status);
                                }
                            } else {
                                if (failure) failure(xhr.status);
                            }
                            if (always) always();
                        }
                    }
                    xhr.send(data);
                } catch(e) {
                    throw e;
                }
            }
        },
        
        httprequest = function (options) {

            options.type = options.type || "GET";
            var settings = options;
            if (!settings.url) {
                throw "API URL is not set";
            }
                
            if (settings.type === "PUT" || settings.type === "POST" ||
                settings.type === "UPDATE") {
                if (!settings.data || typeof settings.data !== 'object') {
                    return;
                } else {
                    settings.data = JSON.stringify(settings.data);
                }
                
                jsonPost(settings.url, settings.data, 
                            settings.success, settings.error, 
                            settings.final, settings.type);
            } else if (settings.type === "GET" || 
                        settings.type === "DELETE") {
                jsonGet(settings.url, settings.data, 
                            settings.success, settings.error, 
                            settings.final, settings.type);
            }
        };
    /**
     * @namespace ibisense
     */
    api = {
        
        baseurl: ApiBaseURL,

        apiKey: function() {
            return ApiKey;
        },
        /**
         * Sets an API key for access to Ibisense cloud.
         * The API key must be set prior to any other API method invocation.
         * If the API key is not set, an exception will be thrown during runtime.
         * @function setApiKey
         * @param {String} key Secret key enabling access to API
         * @memberOf ibisense
         *
         * @example
         * var key = "b689426e006278f9b0b0e9a9f705f159fdc09ede";
         * ibisense.setApiKey(key);
         */ 
        setApiKey: function (key) {
            ApiKey = key;
        },

        /** @ignore */
        httprequest: function (options) {
            httprequest(options);
        },
        
        /**
         * Holds functionality related to models: {@link ibisense.models.Sensor}, 
         * {@link ibisense.models.Channel}, {@link ibisense.models.View},
         * {@link ibisense.models.DataSet}, {@link ibisense.models.DataPoint} 
         * @namespace models
         * @memberOf ibisense
         */
        models: {

            /** 
             * @ignore
             * @typedef {Map} FilterFields
             * @property {String} comparator - Comparator function. Supported functions: 'equal'
             * @property {String} key - Attribute key to match
             * @property {String} value - Attribute value to compare 
             */
             
             /**
             * 
             * Creates new filter. Optionally, the 
             * class instance can be initialized 
             * by passing map containing appropriate fields.
             * @ignore
             * @param {FilterFields} parameters - optional map containing 
             * values which will be used to initialize class instance.
             * @ignore
             * @class Filter
             * @memberOf ibisense.models
             * 
             * @example
             * var filter = new ibisense.models.Filter();
             * var parameters = {
             *    "comparator": "equal",
             *    "key": "tag",
             *    "value": "temperature sensor"
             * };
             *
             * filter = new ibisense.models.Filter(parameters);
             * //Fetch the sensor that match the filter
             * ibisense.sensors.filter(filter, onSuccess, onError);
             *
             */
             
            Filter: function(parameters) {
                if (parameters) {
                    this._comparator  = parameters['comparator'] || 'equal';
                    
                    if (!contains(["equal"], this._comparator)) {
                        this._comparator = "equal";
                    }
                    
                    this._key         = parameters['key'] || '';
                    this._value       = parameters['value'] || '';
                } else {
                    this._comparator  = "equal";
                    this._key         = "";
                    this._value       = "";
                }
                
                this.type = function () {
                    return "ibisense.Filter";
                };
                
                /** 
                 * Gets comparator function of the filter.
                 * @function comparator
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                this.comparator = function() {
                    return this._comparator;
                };
                
                 
                /** 
                 * Sets comparator function of the filter. Supported functoins: equal. Default function: equal
                 * @function setComparator
                 * @param {String} cmp Comparator function
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                 
                this.setComparator = function(cmp) {
                    if (!contains(["equal"], cmp)) {
                        log("Invalid comparator. Supported compartors are: 'equal'");
                        this._comparator = "equal";
                    }
                    this._comparator = cmp;
                };
                
                /** 
                 * Gets key of the filter.
                 * @function key
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                this.key = function() {
                    return this._key;
                };
                
                /** 
                 * Sets key of the filter. The key is the first piece of information that is used to lookup objects 
                 * @function setKey
                 * @param {String} key Key
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                this.setKey = function(key) {
                    this._key = key;
                };
                
                /** 
                 * Gets value of the filter.
                 * @function value
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                this.value = function() {
                    return this._value;
                };
                
                /** 
                 * Sets value of the filter. The value is the second piece of information that is used to lookup objects 
                 * @function setValue
                 * @param {String} value Value
                 * @memberOf ibisense.models.Filter
                 * @instance
                 *
                 */
                this.setValue = function(value) {
                    this._value = value;
                };
                
                /**
                 * Converts an instance of Filter class to JSON object containing fileds as described in {@link FilterFields}
                 * @function toJson
                 * @type {Map} 
                 * @memberOf ibisense.models.Filter
                 * @instance
                 * @return {FilterFields}  - Returns JSON object 
                 */

                this.toJson = function() {
                    var jsonObj = {
                        "comparator": this._comparator,
                        "key": this._key,
                        "value": this._value
                    };
                    
                    return jsonObj;
                };
                
                /**
                 * Converts this instance of this class to JSON string 
                 * (representing JSON object returned by toJson() method)
                 * @function toJsonString
                 * @type {String} 
                 * @memberOf ibisense.models.Filter
                 * @instance
                 */
                 
                this.toJsonString = function () {
                    return JSON.stringify(this.toJson());
                };
            },
             
            /**
             * @typedef {Map} Location 
             * @property {Number} latitude - Latitude part of the location 
             * @property {Number} longitude - Longitude part of the location
             */
             
            /** 
             * @typedef {Map} SensorFields
             * @property {String} SUID - Sensor unique ID
             * @property {String} name - Sensor name
             * @property {String} description - Sensor description 
             * @property {String} access - Access type (owner-only|public)
             * @property {Location} location - Sensor location 
             * @property {Map} attributes - Key-value pairs
             * @property {Array} channels - List of channels bound to sensor
             */

            /**
             * 
             * Creates new sensor. Optionally, the 
             * class instance can be initialized 
             * by passing map containing appropriate fields. Note the sensor is not stored in 
             * Ibisense cloud at this point (to add or update sensor using this object in the cloud, 
             * please refer to {@link ibisense.sensors.add} and {@link ibisense.sensors.update} methods)
             *
             * @param {SensorFields} parameters - optional map containing 
             * values which will be used to initialize class instance.
             * Some or all values in this map can be missing
             *
             * @class Sensor
             * @memberOf ibisense.models
             * 
             * @example
             * var sensor = new ibisense.models.Sensor();
             * var parameters = {
             *    "SUID": "aalu22rsa",
             *    "name": "Temperature sensor 1",
             *    "access": "public",
             *    "location": {
             *        "longitude": 0,
             *        "latitude": 0
             *    }
             * };
             *
             * sensor = new ibisense.models.Sensor(parameters);
             *
             */
             
            Sensor: function (parameters) {
                
                if (parameters) {
                    this._suid         = parameters['SUID'] || '';
                    this._name         = parameters['name'] || ''; 
                    this._description  = parameters['description'] || '';
                    this._accessType   = (parameters['accessType'] &&
                                        parameters['accessType'] === 'owner-only') ? 'public' : 'owner-only';
                    this._latitude     = parameters['latitude'] || 0.0;
                    this._longitude    = parameters['longitude'] || 0.0;

                    this._indor_x      = parameters['indoor_x_coord'] || 0.0;
                    this._indor_y      = parameters['indoor_y_coord'] || 0.0;
                    this._indor_id     = parameters['indoor_id'] || 0.0;

                    this._attributes   = parameters['attributes'] || {};
                    this._channels     = parameters['channels'] || [];
                } else {
                    this._suid        = "";
                    this._name        = "";
                    this._description = "";
                    this._accessType  = "public";
                    this._latitude    = 0.0;
                    this._longitude   = 0.0;
                    this._indor_x     = 0.0;
                    this._indor_y     = 0.0;
                    this._indor_id    = "";
                    this._attributes  = {};
                    this._channels    = []
                }

                this._active = false;
                this._activated = "";
                this._owner_name = "";
                
                this.type = function () {
                    return "ibisense.Sensor";
                };

                /** 
                 * Sets unique identifier of a sensor. If ID is not set,
                 * server will generate a proper ID and return sensor 
                 * object containing properly generated ID. The ID must comprise 8
                 * alpha-numeric characters
                 * @function setSUID
                 * @param {String} suid Sensor identifier
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *  
                 *
                 * @example
                 * var id     = "aalu22rsa";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setSUID(id);
                 *
                 */
                 
                this.setSUID = function (suid) {
                    if (suid && suid.length == 8) {
                        this._suid = suid;
                    }
                };
                
                /**
                 * Returns unique identifier of a sensor 
                 * @function suid
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *
                 * @example
                 * var id     = "aalu22rs";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setSUID(id);
                 * id         = sensor.suid();
                 *
                 */
                this.suid = function () {
                    return this._suid;
                };
                
                /**
                 * Sets name (e.g., human readable name) of this sensor
                 * @function setName
                 * @param {String} name Sensor name
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *  
                 *
                 * @example
                 * var name   = "Temperature sensor 1";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setName(name);
                 *
                 */
                this.setName = function (name) {
                    this._name = name;
                };
                
                /**
                 * Returns human readable name of a sensor 
                 * @function name
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                 
                this.name = function () {
                    return this._name;
                };

                /**
                 * Returns date when the sensor was activated 
                 * @function activated
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.activated = function () {
                    return this._activated;
                };

                this.setActivated = function (activated) {
                    this._activated = activated;
                };

                /**
                 * Returns boolean value which indicates whether the sensor is in active state 
                 * @function active
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.active = function () {
                    return this._active;
                };

                this.setActive = function (active) {
                    this._active = active;
                };

                /**
                 * Returns sensor owner's name 
                 * @function owner
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.owner = function () {
                    return this._owner_name;
                };

                this.setOwner = function (owner_name) {
                    this._owner_name = owner_name;
                };

                /**
                 * Sets description of this sensor
                 * @function setDescription
                 * @param {String} description
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *  
                 *
                 * @example
                 * var desc   = "This is a demo sensor installed in my living room";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setDescription(desc);
                 *
                 */
                this.setDescription = function (desc) {
                    this._description = desc;
                };
                
                /**
                 * Returns description of this sensor 
                 * @function description
                 * @type {String}
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                 
                this.description = function () {
                    return this._description;
                };
                
                /**
                 * Sets access type for this sensor
                 * @function setAccessType
                 * @param {String} type A string (public|owner-only) indicating whether the sensor 
                 * should be readable globally or by owner only.
                 * 
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *  
                 *
                 * @example
                 * var type   = "owner-only";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setAccessType(type);
                 */

                this.setAccessType = function (type) {
                    if(type === "owner-only") {
                        this._accessType = "owner-only";
                    } else {
                        this._accessType = "public";
                    }
                };
                
                /**
                 * Returns true if sensor is in public access, otherwise false
                 * @function isPublic
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * @return {Boolean} 
                 *
                 */

                this.isPublic = function () {
                    if(this._accessType === "owner-only") {
                        return false;
                    } else {
                        return true;
                    }
                };

                
                /**
                 * Sets sensor location
                 * @function setLocation
                 * @param {Number} latitude Latitude
                 * @param {Number} longitude Longitude 
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * 
                 *
                 * @example
                 * var lat    = 60.170014, 
                 *     long   = 24.938466;
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setLocation(lat, long);
                 */

                this.setLocation = function (latitude, longitude) {
                    if (isNaN(latitude) || isNaN(longitude)) {
                        throw "Invalid number";
                    }
                    this._latitude = latitude;
                    this._longitude = longitude;
                };

                /**
                 * Sets sensor indoor location
                 * @function setIndoorLocation
                 * @param {Number} x X coordinate component
                 * @param {Number} y Y coordinate component
                 * @param {Number} x Z coordinate component
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * 
                 *
                 * @example
                 * var x    = 10.0, 
                 *     y    = 10.0,
                 *     id   = "building1:floor1:level1";
                 * var sensor = new ibisense.models.Sensor();
                 * sensor.setIndoorLocation(x, y, id);
                 */

                this.setIndoorLocation = function (x, y, id) {
                    if (isNaN(x) || isNaN(y)) {
                        throw "Invalid number";
                    }
                    this._indor_x = x;
                    this._indor_y = y;
                    this._indor_id = id;
                };

                /**
                 * Returns sensor indoor location
                 * @function indoor_location
                 * @type {Map} Map containing x, y, z indoor coordinates  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * 
                 *
                 * @example
                 * var x    = 10.0, 
                 *     y    = 10.0,
                 *     id   = "building1:floor1:level1";
                 * var sensor = new ibisense.models.Sensor();
                 * var indoor_coords = sensor.indoor_location();
                 * 
                 */

                this.indoor_location = function () {
                    return { 
                        x: this._indor_x, 
                        y: this._indor_y, 
                        id: this._indor_id
                    };
                };

                /**
                 * Returns sensor's latitude
                 * @function latitude
                 * @type {Number}  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.latitude = function () {
                    return this._latitude;
                };
                
                /**
                 * Returns sensor's longitude
                 * @function longitude
                 * @type {Number}  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.longitude = function () {
                    return this._longitude;
                };

                /**
                 * Adds attribute to a sensor
                 * @function addAttribute
                 * @param {String} key Attribute key
                 * @param {String} value Attribute value  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                 
                this.addAttribute = function (key, value) {
                    this._attributes[key] = value;
                };
                
                /**
                 * Returns attribute value by name
                 * @function attribute
                 * @param {String} key Attribute key
                 * @type {String}  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                 
                this.attribute = function (key) {
                    return this._attributes[key];
                };
                
                /**
                 * Returns all attributes as a map object
                 * @function attributes
                 * @type {Map}  
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 *
                 * @example 
                 * var sensor       = new ibisense.models.Sensor();
                 * sensor.addAttribute("Type", "Wireless");
                 * sensor.addAttribute("SamplingFreq", "10min");
                 * var attributes   = sensor.attributes();
                 * var samplingFreq = attributes["SamplingFreq"];
                 * 
                 */
                this.attributes = function() {
                    return this._attributes;
                };
                
                this.delAttribute = function(key) {
                    delete this._attributes[key];
                };

                /**
                 * Returns all channel IDs associated with this sensor as array
                 * @function channels
                 * @type {Array} 
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * 
                 */
                this.channels = function () {
                    return this._channels;
                };
                
                /**
                 * Adds channel ID to list of channels of this sensor
                 * @function addChannel
                 * @param {String} cuid Channel ID to be added
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                this.addChannel = function(cuid) {
                    if (!cuid) throw "Invalid CUID"; 
                    this._channels.push(cuid);
                };
                
                /**
                 * Converts an instance of Channel class to JSON object containing fileds as described in {@link SensorFields}
                 * @function toJson
                 * @type {Map} 
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 * @return {SensorFields}  - Returns JSON object 
                 */

                this.toJson = function() {
                    var jsonObj = {
                        "SUID": this._suid,
                        "name": this._name,
                        "description": this._description,
                        "access": this._accessType,
                        "location": {
                            "longitude": this._longitude,
                            "latitude": this._latitude
                        },
                        "indoor_location": this.indoor_location(),
                        "attributes": this._attributes,
                        "channels": this._channels,
                        "owner_name": this._owner_name,
                        "activated": this._activated,
                        "active": this._active
                    };
                    
                    return jsonObj;
                };
                
                /**
                 * Converts this instance of this class to JSON string 
                 * (representing JSON object returned by toJson() method)
                 * @function toJsonString
                 * @type {String} 
                 * @memberOf ibisense.models.Sensor
                 * @instance
                 */
                 
                this.toJsonString = function () {
                    return JSON.stringify(this.toJson());
                };
            },
            
            /** 
             * @typedef {Map} ChannelFields
             * @property {String} CUID - Channel unique ID
             * @property {String} name - Channel name
             * @property {String} description - Channel description 
             * @property {Map} attributes - Key-value pairs describing this channel
             */
             
            /** 
             * Creates new channel class instance. Note the channel is not stored in Ibisense cloud at this point (to add or update channel using this object in the cloud, please refer to {@link ibisense.channels.add} and {@link ibisense.channels.update} methods)  
             *
             * @param {ChannelFields} parameters - Optional map containing values which will be used to initialize class instance.
             * Some or all values in this map can be missing.
             *
             * @class ibisense.models.Channel
             * @memberOf ibisense.models
             * 
             * @example
             * var channel = new ibisense.models.Channel();
             *
             * var parameters = {
             *    "CUID": "d4sade12",
             *    "name": "Pressure"
             * };
             *
             * channel = new ibisense.models.Channel(parameters);
             * 
             */
             
            Channel: function (parameters) {
            
                if (parameters) {
                    this._cuid         = parameters['CUID'] || '';
                    this._name         = parameters['name'] || ''; 
                    this._description  = parameters['description'] || '';
                    this._unit         = parameters['unit'] || '';
                    this._abbreviation = parameters['abbreviation'] || '';
                    this._attributes   = parameters['attributes'] || {};
                } else {
                    this._cuid         = "";
                    this._name         = "";
                    this._description  = "";
                    this._unit    = "";
                    this._abbreviation = "";
                    this._attributes   = {};
                }

                /** @ignore */
                this.type = function () {
                    return "ibisense.Channel";
                };
                
                /**
                 * Sets channel unique identifier 
                 * @function setCUID
                 * @param {String} cuid Channel identifier
                 * @memberOf ibisense.models.Channel
                 * @instance
                 *  
                 *
                 * @example
                 * var cuid    = "hqlu58rd";
                 * var channel = new ibisense.models.Channel();
                 * channel.setCUID(cuid);
                 */
                 
                this.setCUID = function (cuid) {
                    this._cuid = cuid;
                };
                
                /**
                 * Returns unique identifier of this channel 
                 * @function cuid
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 *
                 * @example
                 * var cuid    = "06274124";
                 * var channel = new ibisense.models.Channel();
                 * channel.setCUID(cuid);
                 * cuid        = channel.cuid();
                 *
                 */
                 
                this.cuid = function () {
                    return this._cuid;
                };
                
                /**
                 * Sets name (e.g., human readable name) of this channel
                 * @function setName
                 * @param {String} name Channel name
                 * @memberOf ibisense.models.Channel
                 * @instance
                 *  
                 *
                 * @example
                 * var name    = "Temperature channel1@sensor1";
                 * var channel = new ibisense.models.Channel();
                 * channel.setName(name);
                 *
                 */
                 
                this.setName = function (name) {
                    this._name = name;
                };
                
                /**
                 * Returns human readable name of this channel 
                 * @function name
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */

                this.name = function () {
                    return this._name;
                };
                
                /**
                 * Sets description of this channel
                 * @function setDescription
                 * @param {String} description
                 * @memberOf ibisense.models.Channel
                 * @instance
                 *  
                 *
                 * @example
                 * var desc    = "This is a channel of sensor installed in my living room";
                 * var channel = new ibisense.models.Channel();
                 * channel.setDescription(desc);
                 */
                 
                this.setDescription = function (desc) {
                    this._description = desc;
                };
                
                /**
                 * Returns description of this channel 
                 * @function description
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                 
                this.description = function () {
                    return this._description;
                };
                
                /**
                 * Adds attribute to this channel
                 * @function addAttribute
                 * @param {String} key Attribute key
                 * @param {String} value Attribute value  
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                 
                this.addAttribute = function (key, value) {
                    this._attributes[key] = value;
                };
                
                /**
                 * Returns channel attribute value by key
                 * @function attribute
                 * @param {String} key Attribute key
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                this.attribute = function (key) {
                    return this._attributes[key];
                };
                
                /**
                 * Returns all attributes as a javascript map
                 * @function attributes
                 * @type {Map}  
                 * @memberOf ibisense.models.Channel
                 * @instance
                 *
                 * @example 
                 * var channel    = new ibisense.models.Channel();
                 * channel.addAttribute("Type", "Temperature");
                 * channel.addAttribute("Precision", "0.01%");
                 * var attributes = channel.attributes();
                 * var precision  = attributes["Precision"];
                 */
                this.attributes = function() {
                    return this._attributes;
                };
                
                /**
                 * Returns channel measurement unit
                 * @function unit
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                 
                this.unit = function () {
                    return this._unit;
                }
                
                /**
                 * Sets channel measurement unit
                 * @function setUnit
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                
                this.setUnit = function (unit) {
                    this._unit = unit;
                }
                
                /**
                 * Returns channel measurement unit abbreviation
                 * @function abbreviation
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                
                this.abbreviation = function () {
                    return this._abbreviation;
                }
                
                /**
                 * Sets channel measurement unit abbreviation
                 * @function setAbbreviation
                 * @type {String}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                
                this.setAbbreviation = function (abbreviation) {
                    this._abbreviation = abbreviation;
                }
                
                /**
                 * Converts an instance of this class to JSON object containing fileds as described in {@link ChannelFields}
                 *
                 * @function toJson
                 * @type {Map}
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                 
                this.toJson = function () {
                
                    var jsonObj = {
                        "CUID": this._cuid,
                        "name": this._name,
                        "description": this._description,
                        "unit": this._unit,
                        "abbreviation": this._abbreviation, 
                        "attributes": this._attributes
                    };

                    return jsonObj;
                };
                
                /**
                 * Converts an instance of this class to JSON String (which is essentially 
                 * a stringified a JSON object returned by toJson() function 
                 * of the this class instance)
                 * 
                 * @function toJsonString
                 * @type {String} 
                 * @memberOf ibisense.models.Channel
                 * @instance
                 */
                this.toJsonString = function() {
                    return JSON.stringify(this.toJson());
                };
            },
            
            /** 
             * @typedef {Map} ViewFields
             * @property {String} VUID - View unique ID
             * @property {String} name - View name
             * @property {String} description - View description 
             * @property {Map} attributes - Key-value pairs
             * @property {Array} channels - List of channels bound to this view
             */
            
            /** 
             * Creates a new View instance. Note the view is not stored in Ibisense cloud at this point (to add or update view using this object in the cloud, please refer to {@link ibisense.views.add} and {@link ibisense.views.update})
             * @param {ViewFields} parameters - Optional map containing values which will be used to initialize class instance. 
             * Some or all values in this map can be missing
             *
             * @class ibisense.models.View
             * @memberOf ibisense.models
             * 
             * @example
             * var view = new ibisense.models.View();
             *
             * var parameters = {
             *    "VUID": "fsas23sa",
             *    "name": "Demo view",
             *    "channels": ["d4sade12"]
             * };
             *
             * view = new ibisense.models.View(parameters);   
             */
             
             
            View: function (parameters) {
            
                if (parameters) {
                    this._vuid        = parameters['VUID'] || '';
                    this._name        = parameters['name'] || ''; 
                    this._description = parameters['description'] || '';
                    this._attributes  = parameters['attributes'] || {};
                    this._channels    = parameters['channels'] || [];
                } else {
                    this._vuid        = "";
                    this._name        = "";
                    this._description = "";
                    this._attributes  = {};
                    this._channels    = [];
                }

                this.type = function () {
                    return "ibisense.View";
                };

                /**
                 * Sets view unique identifier 
                 * @function setVUID
                 * @param {String} vuid View identifier
                 * @memberOf ibisense.models.View
                 * @instance
                 *  
                 *
                 * @example
                 * var id      = "ee12zxgh";
                 * var view    = new ibisense.models.View();
                 * view.setVUID(id);
                 *
                 */
                this.setVUID = function (vuid) {
                    this._vuid = vuid;
                };
                
                /**
                 * Returns unique identifier of a view 
                 * @function vuid
                 * @type {String}
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                this.vuid = function () {
                    return this._vuid;
                };
                
                /**
                 * Sets name (e.g., human readable name) of a view
                 * @function setName
                 * @param {String} name View name
                 * @memberOf ibisense.models.View
                 * @instance
                 *  
                 *
                 * @example
                 * var name = "Demo view for channel1@sensor1";
                 * var view = new ibisense.models.View();
                 * view.setName(name);
                 *
                 */
                 
                this.setName = function (name) {
                    this._name = name;
                };
                
                /**
                 * Returns human readable name of a view 
                 * @function name
                 * @type {String}
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                 
                this.name = function () {
                    return this._name;
                };
                
                /**
                 * Sets description of a view
                 * @function setDescription
                 * @param {String} description
                 * @memberOf ibisense.models.View
                 * @instance
                 *  
                 *
                 * @example
                 * var desc    = "This is a demo view that shows temperature readings " + 
                 *               "of a sensor installed in my living room (channel1@sensor1)";
                 * var view = new ibisense.models.View();
                 * view.setDescription(desc);
                 */
                 
                this.setDescription = function (desc) {
                    this._description = desc;
                };
                
                /**
                 * Returns description of a view 
                 * @function description
                 * @type {String}
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                 
                this.description = function () {
                    return this._description;
                };

                /**
                 * Adds attribute to a view
                 * @function addAttribute
                 * @param {String} key Attribute key
                 * @param {String} value Attribute value  
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                 
                this.addAttribute = function (key, value) {
                    this._attributes[key] = value;
                };
                
                /**
                 * Returns view's attribute value by attribute name
                 * @function attribute
                 * @param {String} key Attribute key
                 * @type {String}
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                 
                this.attribute = function (key) {
                    return this._attributes[key];
                };
                
                /**
                 * Returns all attributes as a map
                 * @function attributes
                 * @type {Map}  
                 * @memberOf ibisense.models.View
                 * @instance
                 *
                 * @example 
                 * var view       = new ibisense.models.View();
                 * view.addAttribute("series_start", "2013-01-20");
                 * view.addAttribute("series_end",   "2013-01-21");
                 * var attributes = view.attributes();
                 * var start      = attributes["series_start"];
                 * var end        = attributes["series_end"];
                 */
                 
                this.attributes = function() {
                    return this._attributes;
                };
                
                /**
                 * Returns all channel IDs associated with this view as array
                 * @function channels
                 * @type {Array} 
                 * @memberOf ibisense.models.View
                 * @instance
                 * 
                 */
                 
                this.channels = function () {
                    return this._channels;
                };
                
                /**
                 * Adds channel ID to list of channels of this view
                 * @function addChannel
                 * @param {String} cuid Channel ID to be added
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                this.addChannel = function (cuid) {
                    this._channels.push(cuid);
                };


                /**
                 * Removes the channel ID from list of channels of this view
                 * @function removeChannel
                 * @param {String} cuid Channel ID to be removed
                 * @memberOf ibisense.models.View
                 * @instance
                 */

                this.removeChannel = function (cuid) {
                    for (var i = 0; i < this._channels.length; i++) {
                        if(this._channels[i] === cuid) {
                            this._channels.splice(i, 1);
                            break;
                        }
                    }
                };

                /**
                 * Removes all channels from the list of channels of this view
                 * @function removeAllChannels
                 * @memberOf ibisense.models.View
                 * @instance
                 */

                this.removeAllChannels = function () {
                    this._channels.splice(0, this._channels.length - 1);
                };

                /**
                 * Converts an instance of this class to JSON object containing fileds as described in {@link ViewFields}
                 *
                 * @function toJson
                 * @type {Map}
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                this.toJson = function () {
                    var jsonObj = {
                        "VUID": this._vuid,
                        "name": this._name,
                        "description": this._description,
                        "attributes": this._attributes,
                        "channels": this._channels
                    };

                    return jsonObj;
                };
                
                /**
                 * Converts an instance of this class to JSON String (which is essentially 
                 * a stringified a JSON object returned by toJson() function 
                 * of the this class instance)
                 *
                 * @function toJsonString
                 * @type {String} 
                 * @memberOf ibisense.models.View
                 * @instance
                 */
                 
                this.toJsonString = function() {
                    return JSON.stringify(this.toJson());
                };
            },
            
            /** 
             * Creates new DataSet instance.
             * @class ibisense.models.DataSet
             * @memberOf ibisense.models
             * 
             * @example
             * var dataset = new ibisense.models.DataSet();   
             */
             
            DataSet: function () {

                this._start      = "";
                this._end        = "";
                this._cuid       = "";
                this._summary    = {};
                this._datapoints = [];

                this.type = function () {
                    return "ibisense.DataSet";
                }
                
                /** Sets resource identifier (channel ID) of this dataset. DateSet represents 
                 *  the collection of datapoints (readings as timeseries) and their summary 
                 *  (single value statistics) of a given resource (channel).
                 *
                 *  @function setCUID 
                 *  @param {String} cuid Channel unique identifier
                 *  @memberOf ibisense.models.DataSet
                 *  @instance
                 *
                 *  @example
                 *  var cuid    = "hqlu58rd";
                 *  var dataset = new ibisense.models.DataSet();
                 *  dataset.setCUID(cuid);
                 */
        
                this.setCUID = function(cuid) {
                    this._cuid = cuid;
                };
                
                /** Returns resource ID (channel ID) for which the data set was fetched 
                 *  @function cuid
                 *  @type {String}
                 *  @instance
                 *  @memberOf ibisense.models.DataSet
                 */
                
                this.cuid = function() {
                    return this._cuid;
                };

                /** Sets the start time of the DataSet. 
                 *  Date can be Date object, 
                 *  time as formatted string, or an integer representing 
                 *  seconds since 1 January 1970 (Unix epoch)    
                 *  @function setStartTime 
                 *  @param {Date} date
                 *  @memberOf ibisense.models.DataSet
                 *  
                 *  @example
                 *  //Time as formatted string
                 *  var start = "2013-01-20",
                 *      end   = "2013-01-21";
                 *  dataset.setStartTime(start);
                 *  //Time as javascript Date
                 *  var start = new Date("2013-01-20"),
                 *      end   = new Date("2013-01-21");
                 *  dataset.setStartTime(start);
                 */
                this.setStartTime = function (date) {
                    if (date instanceof Date) {
                        this._start = date;
                    } else if (typeof date === "string") {
                        this._start = new Date(Date.parse(date));
                    } else if (typeof date === "number") {
                        this._start = new Date(date);
                    } else {
                        throw "Invalid date";
                    }
                };
                
                /** Returns the start time of the DataSet. The result is JavaScript Datetime object 
                 *  @function startTime 
                 *  @type {Date}
                 *  @instance
                 *  @memberOf ibisense.models.DataSet 
                 */
                this.startTime = function () {
                    return this._start;
                };
                
                /** Sets the end time of the DataSet.
                 *  Date can be Date object, 
                 *  time as formatted string, or integer representing 
                 *  seconds since 1 January 1970   
                 *  @function setEndTime 
                 *  @param {Date} date
                 *  @instance
                 *  @memberOf ibisense.models.DataSet
                 *
                 *  @example
                 *  //Time as formatted string
                 *  var start = "2013-20-01",
                 *      end   = "2013-21-01";
                 *  dataset.setEndTime(end);
                 *  //Time as javascript Date
                 *  var start = new Date("2013-20-01"),
                 *      end   = new Date("2013-21-01");
                 *  dataset.setEndTime(end);
                 */
                 
                this.setEndTime = function (date) {
                    if (date instanceof Date) {
                        this._end = date;
                    } else if (typeof date === "string") {
                        this._end = new Date(Date.parse(date));
                    } else if (typeof date === "number") {
                        this._end = new Date(date);
                    } else {
                        throw "Invalid date";
                    }
                };
                
                /** Returns the end time of the DataSet. 
                 *  @function endTime 
                 *  @return {Date} JavaScript Date object
                 *  @instance
                 *  @memberOf ibisense.models.DataSet
                 */
                 
                this.endTime = function () {
                    return this._end;
                };

                /** Sets the value of single point statistic by key <br/> <br/> 
                 *  Allowed statistics are: <br/>
                 *  <b>min</b>   - minimum value in the dataset <br/>
                 *  <b>max</b>   - maximum value in the dataset <br/>
                 *  <b>mean</b>  - mean value in the dataset <br/>
                 *  <b>sum</b>   - sum of all values in the dataset <br/>
                 *  <b>var</b>   - variance in the data <br/>
                 *  <b>count</b> - total number of values in the dataset <br/> 
                 *  @function setSummary 
                 *  @param {String} key Name of the statistic
                 *  @param {Number} value Value of the statistic
                 *  @memberOf ibisense.models.DataSet
                 *  @instance
                 *
                 *  @example
                 *  var dataset = ...;
                 *  dataset.setSummary("count", 2);
                 *  dataset.setSummary("min",  19.5);
                 *  dataset.setSummary("max",  26.1);
                 *  dataset.setSummary("mean", 22.8);
                 *  dataset.setSummary("var",  21.78);
                 *  dataset.setSummary("sum",  45.6);
                 */
                 
                this.setSummary = function (key, value) {
                    
                    if (!contains(["min", "max", "mean", "var", "count", "sum"], key)) {
                        return;
                    }
                    
                    this._summary[key] = value;
                };

                /** Returns value of statistic by its name.
                 *  Allowed statistics are: <br/>
                 *  <b>min</b>   - minimum value in the dataset <br/>
                 *  <b>max</b>   - maximum value in the dataset <br/>
                 *  <b>mean</b>  - mean value in the dataset <br/>
                 *  <b>sum</b>   - sum of all values in the dataset <br/>
                 *  <b>var</b>   - variance in the data <br/>
                 *  <b>count</b> - total number of values in the dataset <br/>
                 *  @function summary 
                 *  @param {String} key Name of the statistic
                 *  @memberOf ibisense.models.DataSet
                 *  @instance
                 *
                 *  @example
                 *  var minimumInDataset  = dataset.summary("min");
                 *  var varianceInDataset = dataset.summary("var");
                 *  var meanInDataset     = dataset.summary("mean"); 
                 */
                 
                this.summary = function (key) {
                    return this._summary[key];
                };
                
                /** Adds instance of ibisense.models.DataPoint to DataSet 
                 *  @function addDataPoint 
                 *  @param {ibisense.models.DataPoint} datapoint
                 *  @memberOf ibisense.models.DataSet
                 *  @instance 
                 */
                 
                this.addDataPoint = function (datapoint) {
                    if (!datapoint || typeof datapoint.type !== "function" ||
                        datapoint.type() !== "ibisense.DataPoint") {
                        throw "The object you have passed is not DataPoint";
                    }

                    this._datapoints.push(datapoint);
                };
                
                /** Returns all datapoints as array of tuples [Date, Number], where Date is an instance of Date object.  
                 *  @function toArray 
                 *  @type {Array}
                 *  @memberOf ibisense.models.DataSet
                 *  @instance 
                 *  @example 
                 * 
                 *  var arrayOfTuples = dataset.toArray();
                 *  for (var i = 0; i < arrayOfTuples.length; i++) {
                 *      var date   = arrayOfTuples[i][0];
                 *      var value  = arrayOfTuples[i][1];
                 *      console.log("Timestamp: " + date.getTime() + " Value: " + value);
                 *  }
                 */
                 
                this.toArray = function() {
                    var arr = [];
                    forEach(this._datapoints, function(dp) {
                        arr.push(dp.toTuple());
                    });
                    return arr;
                };
                
                /** Returns all datapoints as array of tuples [Number (millis), Number]  
                 *  @function toRawArray
                 *  @type {Array}
                 *  @memberOf ibisense.models.DataSet
                 *  @instance
                 *  @example 
                 * 
                 *  var arrayOfRawTuples = dataset.toRawArray();
                 *  for (var i = 0; i < arrayOfRawTuples.length; i++) {
                 *      var ts   = arrayOfTuples[i][0];
                 *      var value  = arrayOfTuples[i][1];
                 *      console.log("Timestamp: " + ts + " Value: " + value);
                 *  }
                 */
                
                this.toRawArray = function() {
                    var arr = [];
                    forEach(this._datapoints, function(dp) {
                        arr.push([dp.toTuple()[0].getTime(), dp.toTuple()[1]]);
                    });
                    return arr;
                };
            
                /** Returns all datapoints as array of {@link ibisense.models.DataPoint} objects  
                 *  @function datapoints 
                 *  @type {Array}
                 *  @memberOf ibisense.models.DataSet
                 *  @instance 
                 */
                 
                this.datapoints = function () {
                    return this._datapoints;
                };
                
                
                this.toJson = function() {
                
                };

                this.toJsonString = function () {

                };
            },
            
            
            /**
             * @typedef {Map} DataPointFields
             * @param {Date} date - Timestamp of the datapoint (date can be in milliseconds, formatted string, or Date object) 
             * @param {Number} value - Value of the datapoint 
             */
            
            /** 
             * Creates a new instance of DataPoint class. Optionally, the class instance
             * can be instantiated with a map. Some or all values in this map can be missing
             *
             * @param {DataPointFields} parameters - Optional map containing values 
             * which will be used to initialize class instance. Some or all values in this map can be missing
             * @class ibisense.models.DataPoint
             * @memberOf ibisense.models
             * 
             * @example
             * var datapoint = new ibisense.models.DataPoint();
             * var parameters = {"date" "2013-01-01T00:00:00", "value": 0 };
             * datapoint = new ibisense.models.DataPoint(parameters);
             */
             
            DataPoint: function (parameters) {
            
                if (parameters && 
                    parameters['date'] &&  
                    parameters['value'] != null && 
                    !isNaN(parameters['value'])) {
                    
                    var date  = parameters['date'];
                    var value = parameters['value'];
                     
                    if (date instanceof Date) {
                        this._timestamp = date;
                    } else if (typeof date === "string") {
                        this._timestamp = new Date(Date.parse(date));
                    } else if (typeof date === "number") {
                        this._timestamp = new Date(date);
                    } else {
                        throw "Invalid date";
                    }
                    
                    if (isNaN(value)) {
                        throw "Invalid number";
                    }
                    this._value = value;
                }
                
                this.type = function () {
                    return "ibisense.DataPoint";
                };
                
                /** Sets timestamp of the datapoint.
                 *  Date can be Date object, 
                 *  formatted datetime string, or an 
                 *  integer representing Unix timestamp
                 *  @function setTimestamp
                 *  @param {Date} date 
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint
                 *  
                 *  @example
                 *
                 *  //Time as formatted string
                 *  dataset.setTimestamp("2013-01-20T00:00");
                 *  //Time as javascript Date
                 *  dataset.setTimestamp(new Date("2013-01-21T00:00"));
                 */
                 
                this.setTimestamp = function (date) {
                    if (date instanceof Date) {
                        this._timestamp = date;
                    } else if (typeof date === "string") {
                        this._timestamp = new Date(Date.parse(date));
                    } else if (typeof date === "number") {
                        this._timestamp = new Date(date);
                    } else {
                        throw "Invalid date";
                    }
                };
                
                /** Returns timestamp as Date object
                 *  @function timestamp
                 *  @type {Date} 
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint 
                 */
                 
                this.timestamp = function () {
                    return this._timestamp;
                };
                
                /** Returns timestamp as integer representing Unix time.
                 *  @function timestampMs
                 *  @type {Date} 
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint 
                 */
                
                this.timestampMs = function () {
                    return this._timestamp.getTime();
                };

                /** Sets value part of the DataPoint 
                 *  @function setValue
                 *  @param {Number} value 
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint 
                 */
                 
                this.setValue = function (value) {
                    if (value == null || isNaN(value)) {
                        throw "Invalid number";
                    }
                    this._value = value;
                };
                
                /** Returns value part of the DataPoint
                 *  @function value
                 *  @type {Number} 
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint 
                 */
                 
                this.value = function () {
                    return this._value;
                };
                
                /** Returns DataPoint as tuple (array with two values)
                 *  Tuple format [ Date, Number ]
                 *  @function toTuple
                 *  @type {Array}
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint
                 */
                 
                this.toTuple = function () {
                    return [this._timestamp, this._value];
                };
                
                /** Converts DataPoint to JSON. The format 
                 * of JSON object which will contain fields as described in {@link DataPointFields} 
                 *
                 *  @function toJson
                 *  @type {Map}
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint
                 */
                
                this.toJson = function() {
                    return {
                        "t": this._timestamp,
                        "v": this._value
                    };
                };
                
                /** Converts DataPoint to JSON string
                 *  @function toJsonString
                 *  @type {String}
                 *  @instance
                 *  @memberOf ibisense.models.DataPoint
                 */

                this.toJsonString = function () {
                    return JSON.stringify(this.toJson());
                };
            }
        },
                
        /**
         * Holds calls {@link ibisense.models.Sensor} API 
         * functionality 
         * @namespace ibisense.sensors
         * @memberOf ibisense
         */
         
        sensors: {
            /**
             * @typedef {Function} errorCallback 
             * @param {Number} status - HTTP status code
             */
             
             /**
             * @typedef {Function} alwaysCallback 
             */
        
            /**
             * @typedef {Function} SensorGetSuccessCallback 
             * @param {ibisense.models.Sensor} sensor - Instance of sensor class 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets sensor by ID.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * 
             * @function get 
             * @param {String} suid Sensor ID
             * @param {SensorGetSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensor, status) {
             *     console.log("HTTP status code: " + status);
             *     console.log("Sensor name: " + sensor.name());
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var suid   = "d735e548";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.get(suid, onSuccess, onError);
             */
              
            get: function (suid, success, error, always) {
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/id/" + suid + "/",
                    final:   always,
                    success: function (jsonObj, status) {
                    
                        var sensor = new ibisense.models.Sensor();
                        
                        sensor.setSUID(jsonObj.SUID);
                        sensor.setName(jsonObj.name);
                        sensor.setDescription(jsonObj.description);
                        sensor.setLocation(jsonObj.location.latitude, jsonObj.location.longitude);
                        sensor.setLocation(jsonObj.location.latitude, jsonObj.location.longitude);                        

                        try {
                            sensor.setIndoorLocation(jsonObj.indoor_location.x, 
                            jsonObj.indoor_location.y, 
                            jsonObj.indoor_location.id);
                        } catch (err) {
                            sensor.setIndoorLocation(0, 0, 0);
                        }

                        sensor.setOwner(jsonObj.owner_name);
                        sensor.setActivated(jsonObj.activated);
                        sensor.setActive(jsonObj.active);
                        sensor.setAccessType(jsonObj.access);

                        for (var key in jsonObj.attributes) {
                            sensor.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        for (var i = 0; i < jsonObj.channels.length; i++) {
                            if (jsonObj.channels[i]) sensor.addChannel(jsonObj.channels[i]);
                        }
                        
                        if (success) success(sensor, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },



            /**
             * Gets sensor by serial number.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * 
             * @function getBySerialNumber 
             * @param {String} serial Sensor serial #
             * @param {SensorGetSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensor, status) {
             *     console.log("HTTP status code: " + status);
             *     console.log("Sensor name: " + sensor.name());
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var serial   = "d7-35-e5-48-1c";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.getBySerialNumber(serial, onSuccess, onError);
             */

            getBySerialNumber: function (serial, success, error, always) {
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/serial/",
                    data:    {serial: serial},
                    final:   always,
                    success: function (jsonObj, status) {
                    
                        var sensor = new ibisense.models.Sensor();

                        sensor.setSUID(jsonObj.SUID);
                        sensor.setName(jsonObj.name);
                        sensor.setDescription(jsonObj.description);
                        sensor.setLocation(jsonObj.location.latitude, jsonObj.location.longitude);

                        try {
                            sensor.setIndoorLocation(jsonObj.indoor_location.x, 
                            jsonObj.indoor_location.y, 
                            jsonObj.indoor_location.id);
                        } catch (err) {
                            sensor.setIndoorLocation(0, 0, 0);
                        }

                        sensor.setOwner(jsonObj.owner_name);
                        sensor.setActivated(jsonObj.activated);
                        sensor.setActive(jsonObj.active);
                        sensor.setAccessType(jsonObj.access);

                        for (var key in jsonObj.attributes) {
                            sensor.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        for (var i = 0; i < jsonObj.channels.length; i++) {
                            if (jsonObj.channels[i]) sensor.addChannel(jsonObj.channels[i]);
                        }
                        
                        if (success) success(sensor, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} SensorFilterSuccessCallback 
             * @param {ibisense.models.Sensor[]} sensors - Array of sensors 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets sensors using filter.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * 
             * @ignore
             * @function filter 
             * @param {ibisense.models.Filter} filter A filter
             * @param {SensorFilterSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensors, status) {
             *     if (status == 200) {
             *         $.each(sensors, function(i, sensor) {
             *             console.log("Sensor: " + sensor.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var filter = new ibisense.models.Filter({'comparator': 'equal', 'key': 'tag', 'value': 'temperature'})
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.filter(filter, onSuccess, onError);
             */
              
            filter: function (filter, success, error, always) {
                
                if (!filter || typeof filter.type !== "function" || 
                    filter.type() !== "ibisense.Filter") {
                    throw "The object you have passed is not a filter";
                }
                
                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/filter/",
                    data:    filter.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var sensors = [];
                        forEach(jsonObj, function (s) {
                        
                            var sensor = new ibisense.models.Sensor();

                            sensor.setSUID(s.SUID);
                            sensor.setName(s.name);
                            sensor.setDescription(s.description);
                            sensor.setLocation(s.location.latitude, s.location.longitude);

                            try {
                                sensor.setIndoorLocation(s.indoor_location.x, 
                                s.indoor_location.y, 
                                s.indoor_location.id);
                            } catch (err) {
                                sensor.setIndoorLocation(0, 0, 0);
                            }

                            sensor.setOwner(s.owner_name);
                            sensor.setActivated(s.activated);
                            sensor.setActive(s.active);
                            sensor.setAccessType(s.access);
                            
                            for (var key in s.attributes) {
                                sensor.addAttribute(key, s.attributes[key]);
                            }
                            
                            for (var i = 0; i < s.channels.length; i++) {
                                if (s.channels[i]) sensor.addChannel(s.channels[i]);
                            }

                            sensors.push(sensor);
                            
                        });
                        if (success) success(sensors, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },

            getByLocation: function (options, success, error, always, private_only) {
                if (!private_only) private_only = false;

                if (!options) {
                    throw "Malformed options";
                }

                options.delta = options.delta || "";
                options.lat = options.lat || 0;
                options.lng = options.lng || 0;
                options.search_all = options.search_all || "false";
                
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/filterbyloc/?only_private=" + private_only,
                    data:    options,
                    final:   always,
                    success: function (jsonObj, status) {
                        var sensors = [];
                        forEach(jsonObj, function (s) {
                        
                            var sensor = new ibisense.models.Sensor();

                            sensor.setSUID(s.SUID);
                            sensor.setName(s.name);
                            sensor.setDescription(s.description);
                            sensor.setLocation(s.location.latitude, s.location.longitude);

                            try {
                                sensor.setIndoorLocation(s.indoor_location.x, 
                                s.indoor_location.y, 
                                s.indoor_location.id);
                            } catch (err) {
                                sensor.setIndoorLocation(0, 0, "");
                            }

                            sensor.setOwner(s.owner_name);
                            sensor.setActivated(s.activated);
                            sensor.setActive(s.active);
                            sensor.setAccessType(s.access);
                            
                            for (var key in s.attributes) {
                                sensor.addAttribute(key, s.attributes[key]);
                            }
                            
                            for (var i = 0; i < s.channels.length; i++) {
                                if (s.channels[i]) sensor.addChannel(s.channels[i]);
                            }

                            sensors.push(sensor);
                            
                        });
                        if (success) success(sensors, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
             
            /**
             * Gets sensors by matching attribute.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * 
             * @function getByAttribute 
             * @param {String} key Attribute key to match
             * @param {String} value Attribute value to match
             * @param {SensorFilterSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensors, status) {
             *     if (status == 200) {
             *         $.each(sensors, function(i, sensor) {
             *             console.log("Sensor: " + sensor.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.getByAttribute("key", "value", onSuccess, onError);
             */
              
            getByAttribute: function (key, value, success, error, always, private_only) {               
                var filter = new ibisense.models.Filter({'comparator': 'equal', 'key': key, 'value': value})
                if (!private_only) private_only = false;
                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/filter/?only_private=" + private_only,
                    data:    filter.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var sensors = [];
                        forEach(jsonObj, function (s) {
                        
                            var sensor = new ibisense.models.Sensor();

                            sensor.setSUID(s.SUID);
                            sensor.setName(s.name);
                            sensor.setDescription(s.description);
                            sensor.setLocation(s.location.latitude, s.location.longitude);


                            try {
                                sensor.setIndoorLocation(s.indoor_location.x, 
                                s.indoor_location.y, 
                                s.indoor_location.id);
                            } catch (err) {
                                sensor.setIndoorLocation(0, 0, "");
                            }

                            sensor.setOwner(jsonObj.owner_name);
                            sensor.setActivated(jsonObj.activated);
                            sensor.setActive(jsonObj.active);
                            sensor.setAccessType(jsonObj.access);
                            
                            for (var key in s.attributes) {
                                sensor.addAttribute(key, s.attributes[key]);
                            }
                            
                            for (var i = 0; i < s.channels.length; i++) {
                                if (s.channels[i]) sensor.addChannel(s.channels[i]);
                            }

                            sensors.push(sensor);
                            
                        });
                        if (success) success(sensors, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} SensorUpdateSuccessCallback
             * @param {ibisense.models.Sensor} sensor - Instance of sensor class reflecting sensor metadata updated in the cloud
             * @param {Number} status - HTTP status code
             */
            
            /**
             * Updates existing sensor with the passed 
             * {@link ibisense.models.Sensor} class instance.  
             * <br/>
             * 
             * @function update 
             * @param {ibisense.models.Sensor} sensor Sensor sensor object to update with
             * @param {SensorUpdateSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always - A callback function which will be always called 
             * after either success or error callback. The function does not take any parameters.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             *
             * var sensor = //Initialized instance of ibisense.models.Sensor class which corresponds to existing sensor;
             *
             * function onSuccess(status) {
             *     if (status == 200) {
             *          console.log("Sensor was updated successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * 
             * sensor.setName("New name");
             * sensor.setDescription("New description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.update(sensor, onSuccess, onError);
             */

            update: function (sensorObj, success, error, always) {

                if (!sensorObj || typeof sensorObj.type !== "function" || 
                    sensorObj.type() !== "ibisense.Sensor") {
                    throw "The object you have passed is not a sensor";
                }

                httprequest({
                    type:    "UPDATE",
                    url:     ApiBaseURL + "update/" + ApiKey + "/sensor/id/",
                    data:    sensorObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} SensorAddSuccessCallback
             * @param {ibisense.models.Sensor} - a newly created sensor with [possibly] updated SUID
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Adds new sensor.
             * 
             * @function add 
             * @param {ibisense.models.Sensor} sensor Sensor sensor object to be added
             * @param {SensorAddSuccessCallback} success A callback function 
             * which will be called on success <br/> <br/>
             * The callback function takes single parameter HTTP status code
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * either after success or error callback.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensor, status) {
             *     if (status == 201) {
             *          console.log("Sensor was added successfully: " + sensor.suid());
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var suid   = "d735e5d4";
             * var sensor = new ibisense.models.Sensor();
             * sensor.setSUID(suid);
             * sensor.setName("Sensor name");
             * sensor.setDescription("Sensor description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.add(sensor, onSuccess, onError);
             */


            add: function (sensorObj, success, error, always) {
                if (!sensorObj || typeof sensorObj.type !== "function" || 
                    sensorObj.type() !== "ibisense.Sensor") {
                    throw "The object you have passed is not a sensor";
                }
                
                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "add/" + ApiKey + "/sensor/id/",
                    data:    sensorObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var sensor = new ibisense.models.Sensor();

                        sensor.setSUID(jsonObj.SUID);
                        sensor.setName(jsonObj.name);
                        sensor.setDescription(jsonObj.description);
                        sensor.setLocation(jsonObj.location.latitude, 
                                            jsonObj.location.longitude);
                        try {
                            sensor.setIndoorLocation(jsonObj.indoor_location.x, 
                                jsonObj.indoor_location.y, 
                                jsonObj.indoor_location.id);
                        } catch (err) {
                            sensor.setIndoorLocation(0, 0, "");
                        }

                        sensor.setOwner(jsonObj.owner_name);
                        sensor.setActivated(jsonObj.activated);
                        sensor.setActive(jsonObj.active);
                        sensor.setAccessType(jsonObj.access);

                        for (var key in jsonObj.attributes) {
                            sensor.addAttribute(key, jsonObj.attributes[key]);
                        }
                        

                        for (var i = 0; i < jsonObj.channels.length; i++) {
                            if (jsonObj.channels[i]) sensor.addChannel(jsonObj.channels[i]);
                        }
                        
                        if (success) success(sensor, status);
                        
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} SensorRemoveSuccessCallback 
             * @param {Number} status - HTTP status code
             */
            
            /**
             * Removes the sensor by sensor ID.
             * <br/>
             * 
             * @function remove 
             * @param {String} suid Sensor ID
             * @param {SensorRemoveSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 200) {
             *         console.log("Sensor was removed");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var suid   = "d735e548";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.remove(suid, onSuccess, onError);
             */

            remove: function (suid, success, error, always) {
                httprequest({
                    type:    "DELETE",
                    url:     ApiBaseURL + "delete/" + ApiKey + "/sensor/id/" + suid + "/",
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} SensorListSuccessCallback 
             * @param {ibisense.models.Sensor[]} sensors - Instance of sensor class 
             * @param {Number} status - HTTP status code
             */
            
            /**
             * Returns list of all public and all owner's sensors.
             * <br/>
             * 
             * @function list 
             * @param {SensorListSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.sensors
             *
             * @example
             * function onSuccess(sensors, status) {
             *     if (status == 200) {
             *         $.each(sensors, function(i, sensor) {
             *             console.log("Sensor: " + sensor.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.list(onSuccess, onError);
             */

            list: function (success, error, always, private_only) {

                if (!private_only) private_only = false; 
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/?only_private=" + private_only,
                    final:   always,
                    success: function (jsonObj, status) {
                        
                        var sensors = [];
                        forEach(jsonObj, function (s) {
                        
                            var sensor = new ibisense.models.Sensor();

                            sensor.setSUID(s.SUID);
                            sensor.setName(s.name);
                            sensor.setDescription(s.description);

                            sensor.setLocation(s.location.latitude, s.location.longitude);

                            try {
                                sensor.setIndoorLocation(s.indoor_location.x, 
                                s.indoor_location.y, 
                                s.indoor_location.id);
                            } catch (err) {
                               sensor.setIndoorLocation(0, 0, "");
                            }

                            sensor.setOwner(s.owner_name);
                            sensor.setActivated(s.activated);
                            sensor.setActive(s.active);
                            sensor.setAccessType(s.access);
                            
                            for (var key in s.attributes) {
                                sensor.addAttribute(key, s.attributes[key]);
                            }
                            
                            for (var i = 0; i < s.channels.length; i++) {
                                if (s.channels[i]) sensor.addChannel(s.channels[i]);
                            }

                            sensors.push(sensor);
                            
                        });
                        if (success) success(sensors, status);
                        
                    },
                    error: function(status) {
                        if (error) error(status);
                        
                    }
                });
            }
        },  

        /**
         * Holds {@link ibisense.models.Channel} API 
         * functionality 
         * @namespace ibisense.channels
         * @memberOf ibisense
         */
         
        channels: {
            /**
             * @typedef {Function} ChannelGetSuccessCallback 
             * @param {ibisense.models.Channel} channel - Instance of channel class 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets channel by channel ID.
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function. 
             * 
             * @function get 
             * @param {String} cuid Channel ID
             * @param {ChannelGetSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(channel, status) {
             *     console.log("HTTP status code: " + status);
             *     console.log("Channel name: " + channel.name());
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var cuid   = "d735e548";
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.get(cuid, onSuccess, onError);
             */
             
            get: function (cuid, success, error, always) {
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/id/" + cuid + "/",
                    final:   always,
                    success: function (jsonObj, status) {
                        var channel = new ibisense.models.Channel();

                        channel.setCUID(jsonObj.CUID);
                        channel.setName(jsonObj.name);
                        channel.setDescription(jsonObj.description);
                        channel.setUnit(jsonObj.unit);
                        channel.setAbbreviation(jsonObj.abbreviation);
                        
                        for (var key in jsonObj.attributes) {
                            channel.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        if (success) success(channel, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} ChannelFilterSuccessCallback 
             * @param {ibisense.models.Channel[]} channels - Array of channels 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets channels using filter.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * @ignore
             * @function filter 
             * @param {ibisense.models.Filter} filter A filters
             * @param {ChannelFilterSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(channels, status) {
             *     if (status == 200) {
             *         $.each(channels, function(i, channel) {
             *             console.log("Channel: " + channel.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var filter = new ibisense.models.Filter({'comparator': 'equal', 'key': 'tag', 'value': 'temperature'})
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.filter(filter, onSuccess, onError);
             */
              
            filter: function (filter, success, error, always) {
                
                if (!filter || typeof filter.type !== "function" || 
                    filter.type() !== "ibisense.Filter") {
                    throw "The object you have passed is not a filter";
                }
                
                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/filter/",
                    data:    filter.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var channels = [];
                        
                        forEach(jsonObj, function (c) {
                        
                            var channel = new ibisense.models.Channel();

                            channel.setCUID(c.CUID);
                            channel.setName(c.name);
                            channel.setDescription(c.description);
                            channel.setUnit(c.unit);
                            channel.setAbbreviation(c.abbreviation);
                            
                            for (var key in c.attributes) {
                                channel.addAttribute(key, c.attributes[key]);
                            }

                            channels.push(channel);
                            
                        });
                        
                        if (success) success(channels, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} ChannelFilterSuccessCallback 
             * @param {ibisense.models.Channel[]} channels - Array of channels 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets channels by matching attrbute.
             * <br/>
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function.
             * 
             * @function getByAttribute 
             * @param {String} key Attribute key to match
             * @param {String} value Attribute value to match
             * @param {ChannelFilterSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error<br/><br/>
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. The function does not take any parameters.
             * This callback is called after success or error function.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(channels, status) {
             *     if (status == 200) {
             *         $.each(channels, function(i, channel) {
             *             console.log("Channel: " + channel.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * ibisense.setApiKey(apiKey);
             * ibisense.sensors.getByAttribute('some key', 'some value', onSuccess, onError);
             */
              
            getByAttribute: function (key, value, success, error, always, private_only) {
                if (!private_only) private_only = false;
                var filter = new ibisense.models.Filter({'comparator': 'equal', 'key': key, 'value': value});
                
                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/filter/?only_private=" + private_only,
                    data:    filter.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var channels = [];
                        
                        forEach(jsonObj, function (c) {
                        
                            var channel = new ibisense.models.Channel();

                            channel.setCUID(c.CUID);
                            channel.setName(c.name);
                            channel.setDescription(c.description);
                            channel.setUnit(c.unit);
                            channel.setAbbreviation(c.abbreviation);
                            
                            for (var key in c.attributes) {
                                channel.addAttribute(key, c.attributes[key]);
                            }

                            channels.push(channel);
                            
                        });
                        
                        if (success) success(channels, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} GetSensorOfAChannelSuccessCallback 
             * @param {ibisense.models.Channel} channel - Instance of sensor class 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets sensor by channel ID.
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function. 
             * 
             * @function getSensor 
             * @param {String} cuid Channel ID
             * @param {GetSensorOfAChannelSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(sensor, status) {
             *     console.log("HTTP status code: " + status);
             *     console.log("Sensor name: " + sensor.name());
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var cuid   = "d735e548";
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.getSensor(cuid, onSuccess, onError);
             */
            
            getSensor: function(cuid, success, error, always) {
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/id/" + cuid + "/sensor/",
                    final:   always,
                    success: function (jsonObj, status) {
                    
                        var sensor = new ibisense.models.Sensor();

                        sensor.setSUID(jsonObj.SUID);
                        sensor.setName(jsonObj.name);
                        sensor.setDescription(jsonObj.description);
                        sensor.setLocation(jsonObj.location.latitude, jsonObj.location.longitude);
                        
                        for (var key in jsonObj.attributes) {
                            sensor.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        for (var i in jsonObj.channels) {
                            sensor.addChannel(jsonObj.channels[i]);
                        }
                        
                        if (success) success(sensor, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ChannelUpdateSuccessCallback 
             * @param {ibisense.models.Channel} channel - instance of channel which was update in the cloud
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Updates existing channel with the passed {@link ibisense.models.Channel} instance.
             * <br/>
             * 
             * @function update 
             * @param {String} suid ID of sensor to which channel belongs
             * @param {ibisense.models.Channel} channel Channel to update
             * @param {ChannelUpdateSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             *
             * var channel = ...;
             *
             * function onSuccess(status) {
             *     if (status == 200) {
             *          console.log("Channel was added successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * 
             * channel.setName("New name");
             * channel.setDescription("New description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.update(channel, onSuccess, onError);
             */
             
            update: function (suid, channelObj, success, error, always) {
                if (!channelObj || typeof channelObj.type !== "function" || 
                    channelObj.type() !== "ibisense.Channel") {
                    throw "The object you have passed is not ibisense.Channel";
                }

                httprequest({
                    type:    "UPDATE",
                    url:     ApiBaseURL + "update/" + ApiKey + "/sensor/id/" + suid + "/channel/",
                    data:    channelObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ChannelAddSuccessCallback 
             * @param {ibisense.models.Channel} channel - instance of channel which was added to the cloud
             * @param {Number} status - HTTP status code
             */
            /**
             * Adds new channel to existing sensor.
             * <br/>
             * 
             * @function add 
             * @param {String} suid Sensor ID to which given channel must be added
             * @param {ibisense.models.Channel} channel Channel object to be added to the cloud
             * @param {ChannelAddSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 201) {
             *          console.log("Sensor was added successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey  = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var suid    = "d735e548";
             * var cuid    = "6e791f0f";
             *
             * var channel = new ibisense.models.Channel();
             * channel.setSUID(cuid);
             * channel.setName("Channel name");
             * channel.setDescription("Channel description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.add(suid, channel, onSuccess, onError);
             */

            add: function (suid, channelObj, success, error, always) {
            
                if (!channelObj || typeof channelObj.type !== "function" || 
                    channelObj.type() !== "ibisense.Channel") {
                    throw "The object you have passed is not a ibisense.Channel";
                }

                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "add/" + ApiKey + "/sensor/id/" + suid + "/channel/",
                    data:    channelObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var channel = new ibisense.models.Channel();

                        channel.setCUID(jsonObj.CUID);
                        channel.setName(jsonObj.name);
                        channel.setDescription(jsonObj.description);
                        channel.setUnit(jsonObj.unit);
                        channel.setAbbreviation(jsonObj.abbreviation);
                        
                        for (var key in jsonObj.attributes) {
                            channel.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        if (success) success(channel, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ChannelRemoveSuccessCallback
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Removes the channel by channel ID.
             * <br/>
             * 
             * @function remove 
             * @param {String} cuid Channel ID
             * @param {ChannelRemoveSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 200) {
             *         console.log("Channel was removed");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var cuid   = "6e791f0f";
             *
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.remove(cuid, onSuccess, onError);
             */
            
            remove: function (cuid, success, error, always) {
                httprequest({
                    type:    "DELETE",
                    url:     ApiBaseURL + "delete/" + ApiKey + "/channel/id/" + cuid + "/",
                    final:   always,
                    success: function (data, textStatus, xhr) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} GetAllChannelsOfSensorSuccessCallback 
             * @param {ibisense.models.Channel[]} channels - Array of channels 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Returns channels of a given sensor
             * <br/>
             * 
             * @function list 
             * @param {String} suid A sensor ID
             * @param {GetAllChannelsOfSensorSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.channels
             *
             * @example
             * function onSuccess(channels, status) {
             *     if (status == 200) {
             *         $.each(channels, function(i, channel) {
             *             console.log("Channel: " + channel.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var suid    = "d735e548";
             *
             * ibisense.setApiKey(apiKey);
             * ibisense.channels.list(suid, onSuccess, onError);
             */
            
            list: function (suid, success, error, always) {
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/sensor/id/" + suid + "/channel/",
                    final:   always,
                    success: function (jsonObj, status) {
                        var channels = [];
                        
                        forEach(jsonObj, function (c) {
                        
                            var channel = new ibisense.models.Channel();

                            channel.setCUID(c.CUID);
                            channel.setName(c.name);
                            channel.setDescription(c.description);
                            channel.setUnit(c.unit);
                            channel.setAbbreviation(c.abbreviation);
                            
                            for (var key in c.attributes) {
                                channel.addAttribute(key, c.attributes[key]);
                            }

                            channels.push(channel);
                            
                        });
                        
                        if (success) success(channels, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            }
        },
        
        /**
         * Holds {@link ibisense.models.View} API 
         * functionality 
         * @namespace ibisense.views
         * @memberOf ibisense
         */
        
        views: {
            /**
             * @typedef {Function} ViewGetSuccessCallback 
             * @param {ibisense.models.View} view - Instance of view class 
             * @param {Number} status - HTTP status code
             */

            /**
             * Gets view by ID.
             * No object is returned immediately, but on success it will be passed 
             * as parameter to a callback function. 
             * 
             * @function get 
             * @param {String} vuid View ID
             * @param {ViewGetSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.views
             *
             * @example
             * function onSuccess(view, status) {
             *     console.log("HTTP status code: " + status);
             *     console.log("Sensor name: " + view.name());
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var vuid   = "84c86d78";
             * ibisense.setApiKey(apiKey);
             * ibisense.views.get(vuid, onSuccess, onError);
             */
            
            get: function (vuid, success, error, always) {
                
                if (!vuid) throw "Invalid VUID";
                
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/view/id/" + vuid + "/",
                    final:   always,
                    success: function (jsonObj, status) {
                        var view    = new ibisense.models.View();

                        view.setVUID(jsonObj.VUID);
                        view.setName(jsonObj.name);
                        view.setDescription(jsonObj.description);
                        
                        for (var key in jsonObj.attributes) {
                            view.addAttribute(key, jsonObj.attributes[key]);
                        }

                        for (var i = 0; i < jsonObj.channels.length; i++) {
                            if (jsonObj.channels[i]) view.addChannel(jsonObj.channels[i]);
                        }
                        
                        
                        if (success) success(view,  status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ViewUpdateSuccessCallback  
             * @param {ibisense.models.View} view - Instance of view class reflecting view metadata updated in the cloud
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Updates existing view with the passed {@link ibisense.models.View} instance.
             * <br/>
             * 
             * @function update
             * @param {ibisense.models.View} view View object to update with
             * @param {ViewUpdateSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.views
             *
             * @example
             *
             * var view = ...;
             *
             * function onSuccess(status) {
             *     if (status == 200) {
             *          console.log("View was updated successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * 
             * view.setName("New name");
             * view.setDescription("New description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.views.update(view, onSuccess, onError);
             */

            
            update: function (viewObj, success, error, always) {
                
                if (!viewObj || viewObj.type() !== "ibisense.View") {
                    throw "The object you have passed is not a ibisense.View";
                }

                httprequest({
                    type:    "UPDATE",
                    url:     ApiBaseURL + "update/" + ApiKey + "/view/id/",
                    data:    viewObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} ViewAddSuccessCallback 
             * @param {ibisense.models.View} view - Instance of view class reflecting view metadata added to the cloud
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Adds new view.
             * <br/>
             * 
             * @function add 
             * @param {ibisense.models.View} view View object to be added
             * @param {ViewAddSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.views
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 201) {
             *          console.log("View was added successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             * 
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var vuid   = "84c86d78";
             * var view = new ibisense.models.View();
             * view.setVUID(vuid);
             * view.setName("View name");
             * view.setDescription("View description");
             * 
             * ibisense.setApiKey(apiKey);
             * ibisense.views.add(view, onSuccess, onError);
             */
            
            add: function (viewObj, success, error, always) {
                if (!viewObj || typeof viewObj.type !== "function" || 
                    viewObj.type() !== "ibisense.View") {
                    throw "The object you have passed is not of type ibisense.View";
                }

                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "add/" + ApiKey + "/view/id/",
                    data:    viewObj.toJson(),
                    final:   always,
                    success: function (jsonObj, status) {
                        var view    = new ibisense.models.View();

                        view.setVUID(jsonObj.VUID);
                        view.setName(jsonObj.name);
                        view.setDescription(jsonObj.description);
                        
                        for (var key in jsonObj.attributes) {
                            view.addAttribute(key, jsonObj.attributes[key]);
                        }
                        
                        for (var i = 0; i < jsonObj.channels.length; i++) {
                            if (jsonObj.channels[i]) view.addChannel(jsonObj.channels[i]);
                        }
                        
                        if (success) success(view,  status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ViewRemoveSuccessCallback 
             * @param {Number} status - HTTP status code
             */
            /**
             * Removes the view by ID.
             * <br/>
             * 
             * @function remove 
             * @param {String} vuid View ID
             * @param {ViewRemoveSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.views
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 200) {
             *         console.log("View was removed");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var vuid   = "84c86d78";
             * ibisense.setApiKey(apiKey);
             * ibisense.views.remove(vuid, onSuccess, onError);
             */
            
            remove: function (vuid, success, error, always) {
                
                if (!vuid) throw "Invalid VUID";
                
                httprequest({
                    type:    "DELETE",
                    url:     ApiBaseURL + "delete/" + ApiKey + "/view/id/" + vuid + "/",
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            /**
             * @typedef {Function} ViewListSuccessCallback 
             * @param {ibisense.models.View[]} views - Array of views 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Returns all public and all owner's views.
             * <br/>
             * 
             * @function list 
             * @param {ViewListSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.views
             *
             * @example
             * function onSuccess(views, status) {
             *     if (status == 200) {
             *         $.each(views, function(i, view) {
             *             console.log("View: " + view.name());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * ibisense.setApiKey(apiKey);
             * ibisense.views.list(onSuccess, onError);
             */
            
            list: function (success, error, always, private_only) {

                if (!private_only) private_only = false; 

                console.log("listing all sensors");

                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/view/?only_private=" + private_only,
                    final:   always,
                    success: function (jsonObj, status) {
                        var views = [];

                        forEach(jsonObj, function (v) {
                        
                            var view = new ibisense.models.View();

                            view.setVUID(v.VUID);
                            view.setName(v.name);
                            view.setDescription(v.description);
                            for (var key in v.attributes) {
                                view.addAttribute(key, v.attributes[key]);
                            }

                            for (var i = 0; i < v.channels.length; i++) {
                                if (v.channels[i]) view.addChannel(v.channels[i]);
                            }

                            views.push(view);
                            
                        });
                        if (success) success(views, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            }
        },
        
        /**
         * Holds API 
         * functionality related to data read/write operations 
         * @namespace ibisense.datapoints
         * @memberOf ibisense
         */
         

        datapoints: {
            /**
             * @typedef {Function} DataPointsGetSuccessCallback 
             * @param {ibisense.models.DataSet} dataset - Instance of dataset class 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Gets ibisense.models.DataSet for given channel ID    
             * 
             * @function get
             * @param {Map} options A map containing request options <br/>
             *              Allowed options:<br/>
             *              <b>cuid</b>  Channel ID for which to retrieve data <br/>
             *              <b>start</b> ISO8601 formatted date representing  
             *                           desired timeseries start time <br/> 
             *              <b>end</b>   ISO8601 formatted date representing 
             *                           desired timeseries end time <br/>
             *              <b>interval</b> Downsampling interval (e.g, Xs, Xmin, Xh, Xd, Xw, where X is an integer) <br/>
             *              <b>func</b>     Downsampling function (avg, min, max, sum) <br/>
             *              (Note: interval and func options are not mandatory)
             * @param {DataPointsGetSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.datapoints
             *
             * @example
             * function onSuccess(dataset, status) {
             *     if (status == 200) {
             *         var min        = dataset.summary("min");
             *         var count      = dataset.summary("count");
             *         var tuples     = dataset.toArray();
             *         var datapoints = dataset.datapoints();
             *         for (var i = 0; i < count; i++) {
             *             console.log(i + ": [" + tuples[i][0] + ", " + tuples[i][0] + "]");
             *         }
             *         // We can do the same thing but 
             *         // iterating directly through array 
             *         // of ibisense.models.DataPoint
             *         $.each(datapoints, function(i, dp) {
             *             console.log(dp.toJsonString());
             *         });
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey  = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var cuid    = "6e791f00";
             * var options = {
             *     cuid     : cuid,
             *     start    : "2013-01-20T19:20:30.45Z",
             *     end      : "2013-01-21T19:20:30.45Z",
             *     func     : "avg",
             *     interval : "1h"
             * };
             *
             * ibisense.setApiKey(apiKey);
             * 
             * ibisense.datapoints.get(options, onSuccess, onError);
             */

            
            get: function (params, success, error, always) {
                var cuid  = undefined,
                    query = {};

                if (params) {
                    if (!params["cuid"]) throw "Invalid CUID";
                    cuid = params["cuid"];

                    if (params["start"] && params["end"]) {
                        try {
                            query["start"] = new Date(params["start"]).toISOString();
                            query["end"] = new Date(params["end"]).toISOString();
                        } catch (e) {
                            delete query["start"];
                            delete query["end"];
                        }
                    }
                    
                    if (contains(["min", "max", "sum", "avg"], params["func"])) {
                        if (params["interval"] && params["interval"] !== "") {
                            query["interval"] = params["interval"];
                            query["function"] = params["func"];
                        }
                    }
                    
                    query["tz"] = params["tz"] || "";
                }
                    
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/id/" + cuid + "/data/",
                    data:    query,
                    final:   always,
                    success: function (jsonObj, status) {

                        var dataset = new ibisense.models.DataSet();

                        dataset.setStartTime(jsonObj.start);
                        dataset.setEndTime(jsonObj.end);
                        dataset.setCUID(jsonObj.CUID);
                        
                        for( var key in jsonObj.summary ) {
                            dataset.setSummary(key, jsonObj.summary[key]);
                        };
                        
                        forEach(jsonObj.data, function (dp) {
                            var datapoint = new ibisense.models.DataPoint();
                            datapoint.setTimestamp(dp.t);
                            datapoint.setValue(dp.v);
                            dataset.addDataPoint(datapoint);
                        });

                        if (success) success(dataset, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * Gets ibisense.models.DataSet containing last datapoint only for given channel ID    
             * 
             * @function getLast
             * @param {String} cuid A channel identifier for which to retrieve the data <br/>
             * @param {DataPointsGetSuccessCallback} success A callback function 
             * which will be called on success 
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure.
             * @type {Void}
             * @memberOf ibisense.datapoints
             *
             * @example
             * function onSuccess(dataset, status) {
             *     if (status == 200) {
             *         //This dataset contains only 1 value which correspoinds to 
             *         //the last datapoint inserted for this timeseries
             *         console.log("Last datapoint for " + cuid + " is " dataset.datapoints()[0].toJsonString());
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * ibisense.setApiKey(apiKey);
             * 
             * ibisense.datapoints.getLast(cuid, onSuccess, onError);
             */

            
            getLast: function (cuid, success, error, always) {
                    
                httprequest({
                    url:     ApiBaseURL + "get/" + ApiKey + "/channel/id/" + cuid + "/data/last/",
                    final:   always,
                    success: function (jsonObj, status) {
                        var dataset = new ibisense.models.DataSet();

                        dataset.setStartTime(jsonObj.start);
                        dataset.setEndTime(jsonObj.end);
                        dataset.setCUID(jsonObj.CUID);
                        
                        for( var key in jsonObj.summary ) {
                            dataset.setSummary(key, jsonObj.summary[key]);
                        };
                        
                        forEach(jsonObj.data, function (dp) {
                            var datapoint = new ibisense.models.DataPoint();
                            datapoint.setTimestamp(dp.t);
                            datapoint.setValue(dp.v);
                            dataset.addDataPoint(datapoint);
                        });

                        if (success) success(dataset, status);
                    },
                    error: function(status) {
                        if (error) error(status);
                    }
                });
            },
            
            /**
             * @typedef {Function} DataPointsAddSuccessCallback 
             * @param {Number} status - HTTP status code
             */
             
            /**
             * Adds datapoints for given channel    
             * 
             * @function add
             * @param {String} cuid Channel ID
             * @param {ibisense.models.DataPoint[]} datapoints Datapoint to store
             * @param {DataPointsAddSuccessCallback} success A callback function 
             * which will be called on success
             * @param {errorCallback} error A callback function which will be called on error
             * @param {alwaysCallback} always A callback function which will be always called 
             * independantly if the API call is success or failure. 
             * @type {Void}
             * @memberOf ibisense.datapoints
             *
             * @example
             * function onSuccess(status) {
             *     if (status == 200) {
             *         console.log("Datapoints were saves successfully");
             *     }
             * }
             *
             * function onError(status) {
             *      console.log("Oops. An error occured : " + status);
             * }
             *
             * var apiKey     = "d4c72dc9ce56ec0af416aedbaf002a29ca55d856";
             * var cuid       = "6e791f0f";
             * var datapoints = [];
             * datapoints.push(new ibisense.models.DataPoint({"date": "2013-01-01T00:01", "value": 1}));
             * datapoints.push(new ibisense.models.DataPoint({"date": "2013-01-01T00:02", "value": 1.5}));
             * datapoints.push(new ibisense.models.DataPoint({"date": "2013-01-01T00:03", "value": 1.1}));
             * datapoints.push(new ibisense.models.DataPoint({"date": "2013-01-01T00:04", "value": 0.2}));
             * datapoints.push(new ibisense.models.DataPoint({"date": "2013-01-01T00:05", "value": 0.1}));
             * ibisense.setApiKey(apiKey);
             * 
             * ibisense.datapoints.add(cuid, datapoints, onSuccess, onError);
             */


            add: function (cuid, datapoints, success, error, always) {
            
                if (!cuid) throw "CUID parameter missing";

                var jsonDataPoints = [];

                forEach(datapoints, function (dp) {
                    if (!dp || typeof dp.type !== "function" ||
                        dp.type() !== "ibisense.DataPoint") {
                        throw "Not an ibisense.DataPoint";
                    }
                    jsonDataPoints.push(dp.toJson());
                });

                httprequest({
                    type:    "POST",
                    url:     ApiBaseURL + "add/" + ApiKey + "/channel/id/" + cuid + "/data/",
                    data:    jsonDataPoints,
                    final:   always,
                    success: function (jsonObj, status) {
                        if (success) success(status);
                    },
                    error:   function (status) {
                        if (error) error(status);
                    }
                });
            }
        }
    };
    return api;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ibisense;
    root.ibisense = ibisense;
}
