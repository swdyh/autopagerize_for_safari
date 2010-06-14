(function() {
    var re = /^http:\/\/search(\.auctions)?\.yahoo\.co\.jp\//
    if (re.test(location.href)) {
        AutoPagerize.addDocumentFilter(removeYahooRedirector)
        removeYahooRedirector(document)
    }
    function removeYahooRedirector(node) {
        var ra = node.querySelectorAll('a[href]')
        for (var i = 0; i < ra.length; i++) {
            var a = ra[i]
            var tmp = a.href.split('*-')
            if (tmp.length == 2) {
                a.href = decodeURIComponent(tmp[1])
            }
        }
    }
})()
