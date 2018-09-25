/**
 * thank you
 * https://github.com/perfectline/geopoint
 */
export class GeoPoint {

    constructor(lon, lat) {
        //super(props);

        switch (typeof(lon)) {
            case 'number':
                this.lonDeg = this.dec2deg(lon, this.MAX_LON);
                this.lonDec = lon;
                break;

            case 'string':
                if (this.decode(lon)) {
                    this.lonDeg = lon;
                }
                this.lonDec = this.deg2dec(lon);
                console.log(this.lonDec);

                break;
        }

        switch (typeof(lat)) {
            case 'number':
                this.latDeg = this.dec2deg(lat, this.MAX_LAT);
                this.latDec = lat;
                break;
            case 'string':
                if (this.decode(lat)) {
                    this.latDeg = lat;
                }
                this.latDec = this.deg2dec(lat);
                break;
        }

    }


    CHAR_DEG : "\u00B0";
    CHAR_MIN : "\u0027";
    CHAR_SEC : "\u0022";
    CHAR_SEP : "\u0020";

    MAX_LON: 180;
    MAX_LAT: 90;

    // decimal
    lonDec: any;
    latDec: any;

    // degrees
    lonDeg: any;
    latDeg: any;

    dec2deg(value, max) {

        let sign = value < 0 ? -1 : 1;

        let abs = Math.abs(Math.round(value * 1000000));

        if (abs > (max * 1000000)) {
            return NaN;
        }

        let dec = abs % 1000000 / 1000000;
        let deg = Math.floor(abs / 1000000) * sign;
        let min = Math.floor(dec * 60);
        let sec = (dec - min / 60) * 3600;

        let result = "";

        result += deg;
        result += this.CHAR_DEG;
        result += this.CHAR_SEP;
        result += min;
        result += this.CHAR_MIN;
        result += this.CHAR_SEP;
        result += sec.toFixed(2);
        result += this.CHAR_SEC;

        return result;

    }

    deg2dec(value) {

        let matches = this.decode(value);

        if (!matches) {
            return NaN;
        }

        let deg = parseFloat(matches[1]);
        let min = parseFloat(matches[2]);
        let sec = parseFloat(matches[3]);

        if (isNaN(deg) || isNaN(min) || isNaN(sec)) {
            return NaN;
        }

        return deg + (min / 60.0) + (sec / 3600);
    }

    decode(value) {
        let pattern = "";

        // deg
        pattern += "(-?\\d+)";
        pattern += this.CHAR_DEG;
        pattern += "\\s*";

        // min
        pattern += "(\\d+)";
        pattern += this.CHAR_MIN;
        pattern += "\\s*";

        // sec
        pattern += "(\\d+(?:\\.\\d+)?)";
        pattern += this.CHAR_SEC;

        return value.match(new RegExp(pattern));
    }

    getLonDec() {
        return this.lonDec;
    }

    getLatDec() {
        return this.latDec;
    }

    getLonDeg() {
        return this.lonDeg;
    }

    getLatDeg() {
        return this.latDeg;
    }

}