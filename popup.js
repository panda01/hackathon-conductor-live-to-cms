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
    fetch(`${protocol}//${hostname}/wp-json/wp/v2/${apiMethod}?include[]=${idInfo.id}`).then(function (response) {
        // The API call was successful!
        return response.json();
    }).then(function (data) {
        console.log(data);
        $pageTitle.innerText = data[0].title.rendered;
        $pageText.innerText = data[0].content.rendered;
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
    const matchingStr = classArr.reduce(function(prev, curr) {
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
                updatePageStatus('This seems to be a wordpress website, but for now this only works on the single posts and pages');
                return;
            }
            // get the id from the current post or page
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
