const CLASS_PAGE_ID_STR = 'page-id-';
const CLASS_POST_ID_STR = 'postid-';
const PAGE_INFO_MSG = 'PAGE_INFO_MSG';
const COND_WP_PROXY_URL = 'https://conductor-live-to-cms-proxy.herokuapp.com:443/article';


const $pageStatus = document.getElementById('page_status');
const $titleInput = document.getElementById('page_title');
const $contentInput = document.getElementById('the_content');
const $contentWrapper = document.getElementById('body_wrapper');
const $validBlock = document.getElementById('valid_wp_content_block');

const currPageInfo = {
    articleId: null,
    isPost: null,
    wpHost: null
};

function updatePageStatus(text) {
    $pageStatus.innerText += '\n' + text;
}

function getPageContentAndTitle(pageInfoObj) {
    const urlToFetch = `${COND_WP_PROXY_URL}?${new URLSearchParams(pageInfoObj)}`
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
            console.warn('Something went wrong with the GET', err);
        });
}

function updatePageContentAndTitle(pageInfoObj) {
    const reqData = {
        ...pageInfoObj,
        content: $contentInput.value,
        password: "BfR3pgknSy4vYIsEBYzQUBCc",
        title: $titleInput.value,
        user: "ahedz",
    }
    updatePageStatus(JSON.stringify(reqData));
    fetch(COND_WP_PROXY_URL, {
        method: 'POST',
        body: JSON.stringify(reqData),
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
        },
    })
        .then(function (response) {
            // The API call was successful!
            return response;
        })
        .then(function (data) {
            updatePageStatus(data);
        })
        .catch(function (err) {
            updatePageStatus('Something went wrong with the POST', err);
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

async function handleGetContentClick(evt) {
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
            currPageInfo.isPost = idInfo.isPost;
            currPageInfo.articleId = idInfo.id;
            currPageInfo.wpHost = (new URL(response.href)).origin;
            getPageContentAndTitle(currPageInfo);
        });
    });
}
function handleUpdateClick() {
    updatePageContentAndTitle(currPageInfo);
}


document.getElementById('check_action_button').addEventListener('click', handleGetContentClick);
document.getElementById('wp_publish').addEventListener('click', handleUpdateClick);
