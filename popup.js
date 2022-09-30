const CLASS_PAGE_ID_STR = 'page-id-';
const CLASS_POST_ID_STR = 'postid-';
const PAGE_INFO_MSG = 'PAGE_INFO_MSG';
const COND_WP_PROXY_URL = 'https://conductor-live-to-cms-proxy.herokuapp.com:443/article';


const $pageStatus = document.getElementById('page_status');
const $titleInput = document.getElementById('page_title');
const $contentInput = document.getElementById('the_content');
const $contentWrapper = document.getElementById('body_wrapper');
const $validBlock = document.getElementById('valid_wp_content_block');

function updatePageStatus(text) {
    $pageStatus.innerText = text;
}

function getPageContentAndTitle(idInfo, url) {
    const { origin } = new URL(url);
    const reqData = {
        wpHost: `${origin}`,
        articleId: idInfo.id,
        isPost: idInfo.isPost
    };
    const urlToFetch = `${COND_WP_PROXY_URL}?${new URLSearchParams(reqData)}`
    fetch(urlToFetch, { method: 'GET' })
        .then(function (response) {
            // The API call was successful!
            return response.json();
        })
        .then(function (data) {
            $validBlock.style.display = 'block';
            $titleInput.value = data.title;
            $contentInput.value = data.content;
        })
        .catch(function (err) {
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

async function handleBtnClick(evt) {
    // set the status to loading
    updatePageStatus('Loading...');
    // set up an error for the rare cases where this just fails
    const errorTimeoutId = setTimeout(function() {
        updatePageStatus('There was an error, reload the page and try again!');
    }, 3000);
    // Get the current page tab you're on.
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {msg: PAGE_INFO_MSG}, function(response) {
            // didn't error out and got a message back, so stop the error message
            clearTimeout(errorTimeoutId);
            // Simple check, should work unless someone changes the default directory
            const isWordpressWebsites = response.scriptsLoaded.includes('wp-content');
            if(!isWordpressWebsites) {
                updatePageStatus('Not wordpress!!! This can only run on Wordpress Pages for now!');
                return;
            }
            // check and see if this is a page or post
            const isAWPPost = checkIfIsWordpressPageOrPost(response.bodyClasses);
            if(isWordpressWebsites && !isAWPPost) {
                updatePageStatus('This seems to be a wordpress website, but for now this only works on the single posts and pages, please navigate to one to edit it');
                return;
            }
            // get the id from the current post or page
            const idInfo = getPostOrPageId(response.bodyClasses, response.href);
            getPageContentAndTitle(idInfo, response.href)
        });
    });
}

async function handleUpdatePageBtn() {

}

document.getElementById('check_action_button').addEventListener('click', handleBtnClick);
// document.getElementById('update_page').addEventListener('click', handleBtnClick);
