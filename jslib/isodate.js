( function() {

    function pad(number) {
        var r = String(number);
        if ( r.length === 1 ) {
            r = '0' + r;
        }
        return r;
    }

    Date.prototype.toISOString = function() {
        return this.getUTCFullYear()
            + '-' + pad( this.getUTCMonth() + 1 )
            + '-' + pad( this.getUTCDate() )
            + 'T' + pad( this.getUTCHours() )
            + ':' + pad( this.getUTCMinutes() )
            + ':' + pad( this.getUTCSeconds() )
            + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
            + 'Z';
    };
}() );

(function (Date, undefined) {
    var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
    Date.parse = function (date) {
        var timestamp, tz,
            rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
            p= rx.exec(date) || [];
        if(p[1]){
            timestamp= p[1].split(/\D/);
            for(var i= 0, L= timestamp.length; i<L; i++){
                timestamp[i]= parseInt(timestamp[i], 10) || 0;
            };
            timestamp[1]-= 1;
            timestamp= new Date(Date.UTC.apply(Date, timestamp));
            if(!timestamp.getDate()) return NaN;
            if(p[5]){
                tz= (parseInt(p[5], 10)*60);
                if(p[6]) tz+= parseInt(p[6], 10);
                if(p[4]== '+') tz*= -1;
                if(tz) timestamp.setUTCMinutes(timestamp.getUTCMinutes()+ tz);
            }
        } else {
            timestamp = origParse ? origParse(date) : NaN;
        }

        return timestamp;
    };
}(Date));
