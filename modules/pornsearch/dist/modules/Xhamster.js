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
    value: function videoUrl(query, page) {
      return 'https://xhamster.com/search?q=' + encodeURI(query) + '&p=' + (page || this.firstpage);
    }
  }, {
    key: 'user_videoUrl',
    value: function user_videoUrl(query, page) {
      //TODO check user or channel
      const url = 'https://xhamster.com/users/' + encodeURI(query) + '/videos/' + (page || this.firstpage)
      //console.log(url)
      return url
    }
  }, /*{
    key: 'info_videoUrl',
    value: function info_videoUrl(query, page) {
      //TODO check user or channel
      const url = encodeURI(query)
      //console.log(url)
      return url
    }
  }, */{
    key: 'user_videoSel',
    value: function user_videoSel() {
      return '.thumb-list__item.video-thumb'
    }
  }, {
    key: 'info_videoSel',
    value: function info_videoSel() {
      return '.thumb-list__item.video-thumb'
    }
  }, {
    key: 'videoParser',
    value: function videoParser($, b, query) {
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
          key: "kw:xhamster?" + query,
          title: img.attr('alt'),
          url: title.attr('href'),
          duration: dur.text(),
          thumb: thumb.attr('src')
        };
      }).get();
    }
  }, {
    key: 'info_videoParser',
    value: function info_videoParser($, b, query) {
      //var videos = $('#content .mozaique .thumb-block');
      var videos = $('.thumb-list__item.video-thumb');
      //console.log(videos)

      var r_videos =  videos.map(function (i, video) {
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
          key: "det_rltd:xhamster?" + query,
          title: img.attr('alt'),
          url: title.attr('href'),
          duration: dur.text(),
          thumb: thumb.attr('src')
        };
      }).get();

      var cats_arr = [] 
      var models_arr = [] 

      var user = $('i.categories-container__icon.user-single')
      var model = $('i.categories-container__icon.pornstar-tag')
      var all_cats = $('i.categories-container__icon')

      var items = $('a.categories-container__item')
      var users = items.find(user)
      var models = items.find(model)
        
      var user_name = "<empty>"
      var user_link = "<empty>"
      users.map(function (i) {
        var data = users.eq(i);
        //console.log(i)
        //console.log(data.parent().text().trim())
        user_name = data.parent().text().trim()
        if (data.parent().attr("href") != undefined)
          user_link = data.parent().attr("href")
      })
      

      models.map(function (i) {
        var data = models.eq(i);
        //console.log(i)
        //console.log(data.parent().text().trim())
        models_arr.push(data.parent().text().trim())
      })

      items.map(function (i) {
        var data = items.eq(i);
        //console.log(i)
        //console.log(data.parent().text().trim())
        cats_arr.push(data.text().trim())
      })

      //var user = 
      var user_dict = { "name" : user_name, "type" : "user", "url" : user_link}

      var title = $(".width-wrap.with-player-container").find("h1").text().trim()

      return {  "self" : {"url" : query,
                          "usr" : user_dict, 
                          "models": models_arr, 
                          "date" : "", 
                          "tags" : cats_arr, 
                          "title" : title,
                          "Views" : 0,
                          "likes" : 0, 
                          "dislikes" : 0},
                "r_videos" : r_videos}
    }
  }, {
    key: 'user_videoParser',
    value: function user_videoParser($, b, query) {
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
          key: "usr:xhamster?" + query,
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
