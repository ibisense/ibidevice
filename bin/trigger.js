/*
  supports: min, max, timeout...
 */

var minTrigger = function(minTrigger) {
    var newDataEvent = function(ibisense, state, datapoint) {
	if(datapoint.value < minTrigger) {
	    ibisense.alert();
	}
    }

    var periodicalEvent = function (ibisense, state) {
	
    }
};

var timeoutTrigger = function(timeoutTrigger) {
    var newDataEvent = function(ibisense, state, datapoint) {

    }

    var periodicalEvent = function (ibisense, state) {
	if(state.last.timestamp - time() > timeoutTrigger) {
	    ibisense.alert();
	}
    }
};

var increasingTrigger = function () {
    var newDataEvent = function(ibisense, state, datapoint) {
	if(data.value > state.lastValue) {
	    ibisense.alert();
	}

	finally { 
	    state.lastValue = data.value;
	}
    }
};


var runDataTriggers = function(datapoint) {
    state = loadstate();
    triggers = channel.triggers;
    foreach in triggers {
	state = loadStateforTrigger(trigger);
	trigger.newDataEvent(state, datapoint);
	saveState(state);
	    
    }
}