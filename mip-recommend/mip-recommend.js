/**
 * @file 推荐组件
 * @author chenrui09
 * @time 2016.11.21
 */

define(function (require) {
    var $ = require('zepto');
    var viewer = require('viewer');
    var RecommendElement = require('customElement').create();
    var recommend;

    RecommendElement.prototype.createdCallback = renderElement;

    function renderElement() {
        var $ele = $(this.element);
        var url = $ele.attr('src') || '//headline.baidu.com/doc/recommended';

        recommend.init({
            $container: $ele,
            url: url
        });
    }

    function getUrlQuery(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return r[2];
        }
        return null;
    }

    function getOriginUrl() {
        var url = location.href;

        if (/mipcache\./g.test(url)) {
            url = url.replace(/^http(s?)\:\/\/mipcache.bdstatic.com\/c\/(s?)/g, function ($0, $1, $2) {
                return $2 === 's' ? 'https://' : 'http://';
            });
            url = url.replace(/\#.*$/g, '');
        }

        return url;
    }

    function formatTime(time) {
        var tempSeconds = 1000 * time;
        if ((new Date() - tempSeconds) < 60000) {
            return '刚刚';
        }
        var tempMinutes = Math.floor((new Date() - tempSeconds) / 60000);
        if (tempMinutes < 60) {
            return tempMinutes + '分钟前';
        }
        var tempHours = Math.floor(tempMinutes / 60);
        if (tempHours < 24) {
            return tempHours + '小时前';
        }
        var tempDate = new Date(tempSeconds);
        var month = tempDate.getMonth() + 1;
        month = month < 10 ? ('0' + month) : month;
        var day = tempDate.getDate() < 10 ? ('0' + tempDate.getDate()) : tempDate.getDate();
        return  month + '-' + day;
    }

    recommend = {
        url: null,
        ajaxData: null,
        isIframe: window.parent !== window,

        init: function (props) {
            this.$container = props.$container;

            this.url = props.url;
            this.ajaxData = {
                'url_key': getOriginUrl(),
                'from': getUrlQuery('from') || 'search',
                'app_from': getUrlQuery('app_from') || 'midway',
                'qid': window.B ? window.B.qid : 0,
                'is_mip': true
            };

            this.request();
            this.delegate();
        },

        request: function () {
            var self = this;

            $.ajax({
                url: this.url,
                dataType: 'jsonp',
                jsonp: 'cb',
                data: this.ajaxData,
                success: function (res) {
                    if (res.status !== 0) {
                        self.error(res.data);
                    } else {
                        self.display(res.data);
                    }
                }
            });
        },

        delegate: function () {
            var isIframe = this.isIframe;

            this.$container.on('click', '.mip-recommend-href', function (e) {
                if (isIframe) {
                    e.preventDefault();

                    var $ele = $(this);
                    viewer.sendMessage('loadiframe', {
                        'url': $ele.attr('href'),
                        'title': $ele.find('.mip-recommend-provider').text(),
                        'click': $ele.data('click')
                    });
                }
            });

            this.$container.on('click', '.mip-recommend-hot-href', function (e) {
                if (isIframe) {
                    e.preventDefault();
                    var $ele = $(this);
                    viewer.sendMessage('urljump', {
                        'url': $ele.attr('href'),
                        'click': $ele.data('click')
                    });
                }
            });
        },

        handleData: function (item, i, action) {
            var data = {
                action: action,
                order: i,
                href: item.url
            };

            return JSON.stringify(data);
        },

        display: function (data) {
            var self = this;
            var htmlNews = '';
            var htmlHots = '';

            data.recommend.forEach(function (item, i) {
                var dataClick = self.handleData(item, i, 'recommend');

                htmlNews += [
                    '<div class="mip-recommend-item">',
                        '<a class="mip-recommend-href" href="' + item.url + '" data-click=\'' + dataClick + '\'>',
                            '<div class="mip-recommend-title">' + item.title + '</div>',
                            '<div class="mip-recommend-info">',
                                '<span>' + formatTime(item.time) + '</span>',
                                '<span class="mip-recommend-provider">' + item.provider + '</span>',
                            '</div>',
                        '</a>',
                    '</div>'
                ].join('');
            });

            data.hot_card.forEach(function (item, i) {
                var dataClick = self.handleData(item, i, 'hotpoint');

                if (i % 2 === 0) {
                    htmlHots += '<div class="mip-recommend-row">';
                }

                htmlHots += [
                    '<div class="mip-recommend-hot-item">',
                        '<a class="mip-recommend-hot-href" href="' + item.url + '" data-click=\'' + dataClick + '\'>',
                            item.query,
                        '</a>',
                    '</div>'
                ].join('');

                if (i % 2 === 1) {
                    htmlHots += '</div>';
                }
            });

            var html = [
                '<div class="mip-recommend-news">',
                    '<h5>相关推荐</h5>',
                    '<div>',
                        htmlNews,
                    '</div>',
                '</div>',
                '<div class="mip-recommend-hotpoints">',
                    '<h5>新闻热点</h5>',
                    '<div>',
                        htmlHots,
                    '</div>',
                '</div>'
            ].join('');

            this.$container.append(html);
        },

        error: function () {

        }
    };

    return RecommendElement;
});