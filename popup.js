const CLASS_PAGE_ID_STR = 'page-id-';
const CLASS_POST_ID_STR = 'postid-';
const PAGE_INFO_MSG = 'PAGE_INFO_MSG';


const $pageStatus = document.getElementById('page_status');
function updatePageStatus(text) {
    $pageStatus.innerText = text;
}
function checkIfIsWordpressPageOrPost(classStr) {
    // determine if these classes meet the threshold for a wordpress page
    const hasPageId = classStr.includes(CLASS_PAGE_ID_STR);
    const hasPostId = classStr.includes(CLASS_POST_ID_STR);
    return hasPageId || hasPostId;
    // update the popup.html to tell the user if the page is available
    // document.getElementById('page_status').innerHTML = 'This is an update by script';
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
    updatePageStatus('idStr: ' + idStr);
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
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {msg: PAGE_INFO_MSG}, function(response) {
            const isAWPPost = checkIfIsWordpressPageOrPost(response.bodyClasses);
            if(!isAWPPost) {
                updatePageStatus('Not wordpress!!! This can only run on Wordpress Pages for now!');
                return;
            }
            const idInfo = getPostOrPageId(response.bodyClasses);
            updatePageStatus(`This is a wordpress ${idInfo.isPost ? 'POST' : 'PAGE'} with the ID: ${idInfo.id}`);
        });
    });
}

document.getElementById('check_action_button').addEventListener('click', handleBtnClick);
