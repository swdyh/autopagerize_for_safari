var SITEINFO_IMPORT_URLS = [
    'http://wedata.net/databases/AutoPagerize/items_all.json',
]
var CACHE_EXPIRE = 24 * 60 * 60 * 1000
var siteinfo = {}
var settings = {}
window.onload = init

function init() {
    var removeOldCache = function() {
        var cache = JSON.parse(localStorage.cacheInfo || '{}')
        var oldUrl = 'http://wedata.net/databases/AutoPagerize/items.json'
        delete cache[oldUrl]
        localStorage.cacheInfo == JSON.stringify(cache)
    }
    removeOldCache()

    safari.application.addEventListener('message', function(event) {
        if (event.name === 'siteinfo') {
            var res = SITEINFO_IMPORT_URLS.reduce(function(r, url) {
                return siteinfo[url] ? r.concat(siteinfo[url].info) : r
            }, []).filter(function(s) {
                return event.message.url.match(s.url)
            })
            event.target.page.dispatchMessage(event.name, res)
        }
        else if (event.name === 'launched') {
        }
        else if (event.name === 'settings') {
            event.target.page.dispatchMessage(event.name, settings)
        }
    }, false)

    safari.application.addEventListener('validate', function(event) {
        try {
            if (event.userInfo) {
                var u = safari.application.activeBrowserWindow.activeTab.url
                event.target.title = 'AutoPagerize ' + (settings.disable ? 'on' : 'off')
            }
        }
        catch(e) {
            event.target.disabled = true
        }
    }, false)

    safari.application.addEventListener('command', function(event) {
        if (event.command === 'autopagerize_toggle') {
            dispatchMessageAll(settings.disable ? 'enableRequest' : 'disableRequest')
            settings.disable = !settings.disable
            safari.extension.settings.setItem('disable', settings.disable)
        }
    }, false)

    settings['display_message_bar'] = safari.extension.settings.getItem('display_message_bar')
    settings['exclude_patterns'] = safari.extension.settings.getItem('exclude_patterns')
    settings['extension_path'] = safari.extension.baseURI
    settings['disable'] = safari.extension.settings.getItem('disable')

    safari.extension.settings.addEventListener('change', function(event) {
        settings[event.key] = event.target[event.key]
        dispatchMessageAll('updateSettings', settings)
    }, false)
}

function loadLocalSiteinfoCallback(data) {
    var url = 'http://wedata.net/databases/AutoPagerize/items_all.json'
    var cache = JSON.parse(localStorage['cacheInfo'] || '{}')
    if (!cache[url]) {
        siteinfo[url] = {
            url: url,
            expire: new Date().getTime() - 1,
            info: reduceWedataJSON(data)
        }
        cache[url] = siteinfo[url]
        localStorage['cacheInfo'] = JSON.stringify(cache)
    }
    else {
        siteinfo[url] = cache[url]
    }
    refreshSiteinfo()
}

function reduceWedataJSON(data) {
    var r_keys = ['url', 'nextLink', 'insertBefore', 'pageElement']
    var info = data.map(function(i) {
        return i.data
    }).filter(function(i) {
        return ('url' in i)
    })
    if (info.length == 0) {
        return []
    }
    else {
        info.sort(function(a, b) {
            return (b.url.length - a.url.length)
        })
        return info.map(function(i) {
            var item = {}
            r_keys.forEach(function(key) {
                if (i[key]) {
                    item[key] = i[key]
                }
            })
            return item
        })
    }
}

function refreshSiteinfo() {
    var cache = JSON.parse(localStorage['cacheInfo'] || '{}')
    SITEINFO_IMPORT_URLS.forEach(function(url) {
        if (!cache[url] || (cache[url].expire && new Date(cache[url].expire) < new Date())) {
            var callback = function(res) {
                if (res.status != 200) {
                    return
                }
                var info = reduceWedataJSON(JSON.parse(res.responseText))
                if (info.length == 0) {
                    return
                }
                siteinfo[url] = {
                    url: url,
                    expire: new Date().getTime() + CACHE_EXPIRE,
                    info: info
                }
                cache[url] = siteinfo[url]
                localStorage['cacheInfo'] = JSON.stringify(cache)
            }
            try {
                get(url, callback)
            }
            catch(e) {
            }
        }
    })
}

function get(url, callback, opt) {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback(xhr)
        }
    }
    xhr.open('GET', url, true)
    xhr.send(null)
    return xhr
}

function dispatchMessageAll(message, obj, urlpattern) {
    safari.application.browserWindows.forEach(function(w) {
        w.tabs.forEach(function(t) {
            if (!urlpattern || urlpattern.match(t.url)) {
                if (t.page) {
                    t.page.dispatchMessage(message, obj)
                }
            }
        })
    })
}
