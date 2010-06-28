var SITEINFO_IMPORT_URLS = [
    'http://wedata.net/databases/AutoPagerize/items.json',
]
var CACHE_EXPIRE = 24 * 60 * 60 * 1000
var siteinfo = {}
var launched = {}
var settings = {}
window.onload = init

function init() {
    safari.application.addEventListener('message', function(event) {
        if (event.name === 'siteinfoChannel') {
            var res = SITEINFO_IMPORT_URLS.reduce(function(r, url) {
                return r.concat(siteinfo[url].info)
            }, []).filter(function(s) {
                return event.message.url.match(s.url)
            })
            event.target.page.dispatchMessage('siteinfoChannel', res)
        }
        else if (event.name === 'launched') {
            launched[event.message.url] = true
        }
        else if (event.name === 'settings') {
            event.target.page.dispatchMessage('settings', settings)
        }
    }, false)

    safari.application.addEventListener('validate', function(event) {
        if (event.command === 'autopagerize_toggle') {
            var u = safari.application.activeBrowserWindow.activeTab.url
            if (!launched[u]) {
                event.target.disabled = true
            }
        }
    }, false)

    safari.application.addEventListener('command', function(event) {
        if (event.command === 'autopagerize_toggle') {
            safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('toggleRequestChannel')
        }
    }, false)

    settings['display_message_bar'] = safari.extension.settings.getItem('display_message_bar')
    settings['exclude_patterns'] = safari.extension.settings.getItem('exclude_patterns')
    settings['extension_path'] = safari.extension.baseURI
    safari.extension.settings.addEventListener('change', function(event) {
        settings[event.key] = event.target[event.key]
        safari.application.browserWindows.forEach(function(w) {
            w.tabs.forEach(function(t) {
                t.page.dispatchMessage('updateSettings', settings)
            })
        })
    }, false)
}

function loadLocalSiteinfoCallback(data) {
    var url = 'http://wedata.net/databases/AutoPagerize/items.json'
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

