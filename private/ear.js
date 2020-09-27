const S3_URL_PREFIX = 'https://onairear.s3.eu-west-2.amazonaws.com';

const FEED_PAGE_LEN_DEF = 25;
const TRACK_PAGE_LEN_DEF = 25;

function reload_data_ftm(callback) {
    $.ajax({
        type: "POST",
        url: "/get_feeds_tracks_maps",
        data: {},
        success: function (data) {
            //console.log(data);
            tracks = data.Tracks.Items;
            feeds = data.Feeds.Items;
            track_feed_map = data.Maps.Items;
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

// track_feed_generic
function bind_track_feed(track_id, feed_id, callback) {
    $.ajax({
        type: "POST",
        url: "/bind_track_feed",
        data: { trackID: track_id, feedID: feed_id },
        success: function (data) {
            //console.log(data);
            //if OK just update map and redraw
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

function unbind_track_feed(track_id, feed_id, callback) {
    $.ajax({
        type: "POST",
        url: "/unbind_track_feed",
        data: { trackID: track_id, feedID: feed_id },
        success: function (data) {
            //console.log(data);
            //if OK just update map and redraw
            callback(null, data);
        },
        error: function (err) {
            console.error(err);
            callback(err, null);
        }
    });
}

function pad(number) {
    if (number < 10) {
        return '0' + number;
    }
    return number;
}

// UTC
/*
Date.prototype.toISOString = function () {
    return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        ' ' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds());// +
    //'.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    //'Z';
};
*/
// local
Date.prototype.toISOString = function () {
    return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        ' ' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds());// +
    //'.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
    //'Z';
};

function setCookie(name, value, options) {
    options = options || {};

    const expires = options.expires;
    if (typeof expires == "number" && expires) {
        const d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    }

    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    }

    value = encodeURIComponent(value);

    const updatedCookie = name + "=" + value;

    for (let propName in options) {
        updatedCookie += "; " + propName;
        const propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        }
    }

    document.cookie = updatedCookie;
}

function getCookie(name) {
    const matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function deleteCookie(name) {
    setCookie(name, "", {
        expires: -1
    });
}

$(document).ready(function () {
    'use strict'
    console.log("HI")
    console.log($('[data-toggle="push-menu"]'))
    
//    $('.sidebar-toggle.fa5').on('click', function (e) {
  //      console.log("on click")
    //});

    /**
     * Get access to plugins
     */
    //var $layout = $('body').data('lte.layout')
    //$('[data-toggle="control-sidebar"]').controlSidebar()
    //$('[data-toggle="push-menu"]').pushMenu('toggle')
    /*
    var $pushMenu = $('[data-toggle="push-menu"]').data('lte.pushmenu')
    var $controlSidebar = $('[data-toggle="control-sidebar"]').data('lte.controlsidebar')
    var $layout = $('body').data('lte.layout')
    $(window).on('load', function() {
        console.log("onload")
        // Reinitialize variables on load
        $pushMenu = $('[data-toggle="push-menu"]').data('lte.pushmenu')
        $controlSidebar = $('[data-toggle="control-sidebar"]').data('lte.controlsidebar')
        $layout = $('body').data('lte.layout')
    })
    */
})