(function() {
    const PAGE_INFO_MSG = 'PAGE_INFO_MSG';
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.msg === PAGE_INFO_MSG) {
            const allTheScripts = document.getElementsByTagName('script');
            const scriptsSrcArr = Array.from(allTheScripts, script => script.src);
            sendResponse({
                bodyClasses: document.body.className,
                href: window.location.href,
                scriptsLoaded: scriptsSrcArr.join(' ')
            });
        }
    });
}());
