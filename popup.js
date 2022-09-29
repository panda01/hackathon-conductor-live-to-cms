const CLASS_PAGE_ID_STR = 'page-id-';
const CLASS_POST_ID_STR = 'postid-';
const PAGE_INFO_MSG = 'PAGE_INFO_MSG';


const $pageStatus = document.getElementById('page_status');
const $pageTitle = document.getElementById('page_title');
const $pageText = document.getElementById('page_text');

function updatePageStatus(text) {
    $pageStatus.innerText = text;
}

function updatePageTitle(idInfo, url) {
    const { protocol, hostname } = new URL(url);
    const apiMethod = idInfo.isPost ? 'posts' : 'pages';
    fetch(`https://conductor-live-to-cms-proxy.herokuapp.com/article?wpHost=${url}&articleId=${idInfo.id}&isPost=${idInfo.isPost}`)
        .then(function (response) {
            // The API call was successful!
            return response.json();
        }).then(function (data) {
        console.log(data);
        $pageTitle.innerText = data.title;
        $pageText.innerText = data.content;
    }).catch(function (err) {
        console.warn('Something went wrong.', err);
    });
}

function checkIfIsWordpressPageOrPost(classStr) {
    // determine if these classes meet the threshold for a wordpress page
    const hasPageId = classStr.includes(CLASS_PAGE_ID_STR);
    const hasPostId = classStr.includes(CLASS_POST_ID_STR);
    return hasPageId || hasPostId;
}

function getPostOrPageId(bodyClasses) {
    // split the classes into an array
    const classArr = bodyClasses.split(' ');
    // go through each one and find the proper string
    const matchingStr = classArr.reduce(function (prev, curr) {
        if (prev) {
            return prev;
        }
        return checkIfIsWordpressPageOrPost(curr) ? curr : false;
    }, false);
    // get and parse the ID
    const isPost = matchingStr.includes(CLASS_POST_ID_STR);
    const stringForLength = isPost ? CLASS_POST_ID_STR : CLASS_PAGE_ID_STR;
    const idStr = matchingStr.substring(stringForLength.length);
    const id = parseInt(idStr, 10);
    // return an object like
    // { isPost: boolean, id: number }
    return {
        isPost,
        id
    }
}

async function handleBtnClick() {
    updatePageStatus('Loading...');
    const errorTimeoutId = setTimeout(function () {
        updatePageStatus('There was an error, reload the page and try again!');
    }, 3000);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {msg: PAGE_INFO_MSG}, function (response) {
            clearTimeout(errorTimeoutId);
            const isWordpressWebsites = response.scriptsLoaded.includes('wp-content');
            const isAWPPost = checkIfIsWordpressPageOrPost(response.bodyClasses);
            if (!isWordpressWebsites) {
                updatePageStatus('This is not a wordpress website');
                return;
            }
            if (isWordpressWebsites && !isAWPPost) {
                updatePageStatus('This seems to be a wordpress website, but for now this only works on the single posts and pages');
                return;
            }
            if (!isAWPPost) {
                updatePageStatus('Not wordpress!!! This can only run on Wordpress Pages for now!');
                return;
            }
            const idInfo = getPostOrPageId(response.bodyClasses, response.href);
            updatePageStatus(`This is a wordpress ${idInfo.isPost ? 'POST' : 'PAGE'} with the ID: ${idInfo.id}`);
            updatePageTitle(idInfo, response.href)
        });
    });
}

async function handleUpdatePageBtn() {

}

document.getElementById('check_action_button').addEventListener('click', handleBtnClick);
document.getElementById('update_page').addEventListener('click', handleBtnClick);
