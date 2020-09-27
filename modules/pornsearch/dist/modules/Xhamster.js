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

var _VideoMixin = require('../core/VideoMixin');

var _VideoMixin2 = _interopRequireDefault(_VideoMixin);

var _AbstractModule = require('../core/AbstractModule');

var _AbstractModule2 = _interopRequireDefault(_AbstractModule);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Xhamster = function (_AbstractModule$with) {
  (0, _inherits3.default)(Xhamster, _AbstractModule$with);

  function Xhamster() {
    (0, _classCallCheck3.default)(this, Xhamster);
    return (0, _possibleConstructorReturn3.default)(this, (Xhamster.__proto__ || (0, _getPrototypeOf2.default)(Xhamster)).apply(this, arguments));
  }

  (0, _createClass3.default)(Xhamster, [{
    key: 'videoUrl',
    value: function videoUrl(page) {
      return 'https://xhamster.com/search?q=' + encodeURI(this.query) + '&p=' + (page || this.firstpage);
    }
  }, {
    key: 'videoParser',
    value: function videoParser($) {
      //var videos = $('#content .mozaique .thumb-block');
      var videos = $('.thumb-list__item.video-thumb');
      //console.log(videos)

      return videos.map(function (i, video) {
        var cache = $(video);
        
        var title = cache.find('a.video-thumb__image-container.thumb-image-container').eq(0);
        var img = cache.find('img.thumb-image-container__image').eq(0);
        var dur = cache.find('.thumb-image-container__duration').eq(0);
        var thumb = cache.find('img.thumb-image-container__image').eq(0);

        //console.log(img.attr('alt'))
        //console.log(title.attr('href'))
        //console.log(dur.text())
        //console.log(thumb.attr('src'))

        return {
          title: img.attr('alt'),
          url: title.attr('href'),
          duration: dur.text(),
          thumb: thumb.attr('src')
        };
      }).get();
    }
  }, {
    key: 'relatedVideoParser',
    value: function relatedVideoParser($, b) {
      //var videos = $('#content .mozaique .thumb-block');
      var videos = $('.thumb-list__item.video-thumb');
      //console.log(videos)

      return videos.map(function (i, video) {
        var cache = $(video);
        
        var title = cache.find('a.video-thumb__image-container.thumb-image-container').eq(0);
        var img = cache.find('img.thumb-image-container__image').eq(0);
        var dur = cache.find('.thumb-image-container__duration').eq(0);
        var thumb = cache.find('img.thumb-image-container__image').eq(0);

        //console.log(img.attr('alt'))
        //console.log(title.attr('href'))
        //console.log(dur.text())
        //console.log(thumb.attr('src'))

        return {
          title: img.attr('alt'),
          url: title.attr('href'),
          duration: dur.text(),
          thumb: thumb.attr('src')
        };
      }).get();
    }
  }, {
    key: 'name',
    get: function get() {
      return 'Xhamster';
    }
  }, {
    key: 'firstpage',
    get: function get() {
      return 0;
    }
  }]);
  return Xhamster;
}(_AbstractModule2.default.with(_VideoMixin2.default));

exports.default = Xhamster;
module.exports = exports['default'];
