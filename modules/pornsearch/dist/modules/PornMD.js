'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var request = require("request")

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

var PornMD = function (_AbstractModule$with) {
  (0, _inherits3.default)(PornMD, _AbstractModule$with);

  function PornMD() {
    (0, _classCallCheck3.default)(this, PornMD);
    return (0, _possibleConstructorReturn3.default)(this, (PornMD.__proto__ || (0, _getPrototypeOf2.default)(PornMD)).apply(this, arguments));
  }

  (0, _createClass3.default)(PornMD, [{
    key: 'videoUrl',
    value: function videoUrl(page) {
      const url = 'https://www.pornmd.com/straight/' + encodeURI(this.query) + '?source=pornhub&start=' + (20 * (parseInt(page) - 1))
      console.log(url)
      return url
    }
  }, {
    key: 'gifUrl',
    value: function gifUrl(page) {
      // TODO
      return '';
    }
  }, {
    key: 'videoParser',
    value: async function videoParser($, b) {
      //console.log(b)
      //var videos = $('ul.videos.search-video-thumbs li');
      var videos = $('.video-info-container');
 
      var act = videos.map(function (i) {
          var data = videos.eq(i);

          if (!data.length) {
            return;
          }

          const src = data.find(".grid-video-source.clear.info-box").text()
          if (src != "Pornhub") {
            return;
          }

          const lenght = data.find(".video-lenght.info-box").text()

          var r_url = 'https://www.pornmd.com' + data.find('a').eq(0).attr('href');

          return new Promise(function(resolve, reject) {
            request({ url: r_url, followRedirect: false }, function (err, res, body) {
              console.log(res.headers.location);

              resolve({
                title: data.find('a').text().trim(),
                url: res.headers.location,
                duration: data.find('.duration').text(),
                //thumb: thumb.replace(/\([^)]*\)/g, '')
              });
            });
          });
        }).get()

      console.log("DONE++++++++++++++++")
      return await Promise.all(act)
    }
  }, {
    key: 'gifParser',
    value: function gifParser($) {
      var gifs = $('ul.gifs.gifLink li');

      return ""
    }
  }, {
    key: 'name',
    get: function get() {
      return 'PornMD';
    }
  }, {
    key: 'firstpage',
    get: function get() {
      return 1;
    }
  }]);
  return PornMD;
}(_AbstractModule2.default.with(_GifMixin2.default, _VideoMixin2.default));

exports.default = PornMD;
module.exports = exports['default'];