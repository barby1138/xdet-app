'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _GifMixin = require('../core/GifMixin');

var _GifMixin2 = _interopRequireDefault(_GifMixin);

var _VideoMixin = require('../core/VideoMixin');

var _VideoMixin2 = _interopRequireDefault(_VideoMixin);

var _AbstractModule = require('../core/AbstractModule');

var _AbstractModule2 = _interopRequireDefault(_AbstractModule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Pornhub = function (_AbstractModule$with) {
  (0, _inherits3.default)(Pornhub, _AbstractModule$with);

  function Pornhub() {
    (0, _classCallCheck3.default)(this, Pornhub);
    return (0, _possibleConstructorReturn3.default)(this, (Pornhub.__proto__ || (0, _getPrototypeOf2.default)(Pornhub)).apply(this, arguments));
  }

  (0, _createClass3.default)(Pornhub, [{
    key: 'videoUrl',
    value: function videoUrl(page) {
      return 'http://www.pornhub.com/video/search?search=' + encodeURI(this.query) + '&page=' + (page || this.firstpage);
    }
  }, {
    key: 'user_videoUrl',
    value: function user_videoUrl(page) {
      //TODO check user or channel
      const url = 'http://www.pornhub.com/users/' + encodeURI(this.query) + '/videos/public?page=' + (page || this.firstpage)
      //console.log(url)
      return url
    }
  }, {
    key: 'user_videoSel',
    value: function user_videoSel() {
      return '.videos.row-3-thumbs li'
    }
  }, {
    key: 'gifUrl',
    value: function gifUrl(page) {
      return 'http://www.pornhub.com/gifs/search?search=' + encodeURI(this.query) + '&page=' + (page || this.firstpage);
    }
  }, {
    key: 'videoParser',
    value: function videoParser($, b) {
      //console.log(b)
      var videos = $('ul.videos.search-video-thumbs li');
      
      return videos.map(function (i) {
        var data = videos.eq(i);
        if (!data.length) {
          return;
        }

        var url = data.find('a').eq(0).attr('href')
        if (url == undefined) {
          return;
        }
        
        var thumb = data.find('img').attr('data-mediumthumb') || '';

        return {
          title: data.find('a').text().trim(),
          url: 'http://pornhub.com' + data.find('a').eq(0).attr('href'),
          duration: data.find('.duration').text(),
          thumb: thumb.replace(/\([^)]*\)/g, '')
        };
      }).get();
    }
  }, {
    key: 'relatedVideoParser',
    value: function relatedVideoParser($, b) {
      //console.log(b)
      var users = $('.usernameWrap.clearfix');
      var users_new = users.map(function (i) {
        var data = users.eq(i)
        if (data.parent().text().indexOf("From:") != -1) {
          //console.log("user: " + data.attr("data-type"))
          //console.log("user URL: " + 'http://pornhub.com' + data.find('a').eq(0).attr('href'))
          return data
        }
      })
      var user = null
      if (users_new.length > 0) {
        user = users_new[0]
      }
      
      var user_dict = {}
      if (user != null) {
        const usr_name = user.find('a').eq(0).text()
        const usr_type = user.attr("data-type")
        const usr_url = 'http://pornhub.com' + user.find('a').eq(0).attr('href')
        //console.log("user type: " + usr_type)
        //console.log("user name: " + usr_name)
        //console.log("user URL: " + usr_url)

        user_dict = { "name" : usr_name, "type" : usr_type, "url" : usr_url}
      }

      var videos = $('ul.videos.underplayer-thumbs li');

      //li.js-pop.videoblock.videoBox

      var r_videos = videos.map(function (i) {
        var data = videos.eq(i);
        if (!data.length) {
          return
        }

        var thumb = data.find('img').attr('data-mediumthumb') || '';
        
        return {
          title: data.find('a').text().trim(),
          url: 'http://pornhub.com' + data.find('a').eq(0).attr('href'),
          duration: data.find('.duration').text(),
          thumb: thumb.replace(/\([^)]*\)/g, '')
        };
      }).get();

      return {"usr" : user_dict, "r_videos" : r_videos}
    }
  }, {
    key: 'user_videoParser',
    value: function user_videoParser($, b) {
      //console.log(b)
      //console.log(b)
      //#moreData
      var videos = $('.videos.row-3-thumbs li');

      //console.log(videos)
      return videos.map(function (i) {
        var data = videos.eq(i);

        if (!data.length) {
          return
        }

        var thumb = data.find('img').attr('data-mediumthumb') || '';
        
        return {
          title: data.find('a').text().trim(),
          url: 'http://pornhub.com' + data.find('a').eq(0).attr('href'),
          duration: data.find('.duration').text(),
          thumb: thumb.replace(/\([^)]*\)/g, '')
        };
      }).get();
    }
  }, {
    key: 'gifParser',
    value: function gifParser($) {
      var gifs = $('ul.gifs.gifLink li');

      return gifs.map(function (i, gif) {
        var data = $(gif).find('a');

        return {
          title: data.find('span').text(),
          url: 'http://dl.phncdn.com#id#.gif'.replace('#id#', data.attr('href')),
          webm: data.find('video').attr('data-webm')
        };
      }).get();
    }
  }, {
    key: 'name',
    get: function get() {
      return 'Pornhub';
    }
  }, {
    key: 'firstpage',
    get: function get() {
      return 1;
    }
  }]);
  return Pornhub;
}(_AbstractModule2.default.with(_GifMixin2.default, _VideoMixin2.default));

exports.default = Pornhub;
module.exports = exports['default'];