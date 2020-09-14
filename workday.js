console.log("loaded in workday");

browser.runtime.onMessage.addListener(notify);

var boxIndex = 0;


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function notify(message) {
  console.log("Received message:", message);
  
  switch (message.command) {
    case "queue-boxes":
      return queueBoxes(message);
    case "click-current-box":
      return clickCurrentBox(message);
    case "read-popup":
      return readPopup(message);
    case "close-popup":
      return closePopup(message);
    case "is-popup-open":
      return isPopupOpen(message);
    default:
      break;
  }
}


function queueBoxes(message) {
  boxIndex = 0;
  console.log("Queued Boxes");
  
  return Promise.resolve();
}

function clickCurrentBox(message) {
  let boxes = $("div[data-automation-id='calendarevent'][data-automation-appointment-style='approved']").toArray().sort();
  let box = boxes[boxIndex++];
  
  console.log("found boxes:", boxes);
  console.log("clicking box:", box);
  
  box.click();
  console.log("Clicked box:", box);
  
  return Promise.resolve(boxes.length - boxIndex);
}
  
function readPopup(message) {
  
  if (isPopupEnterTime()) {
    return readEnterTimePopup(message);
  } else {
    return readTimeBlockPopup(message);
  }
}

function closePopup(message) {
  let button = $("button[title='Close'], button[title='Cancel'][data-automation-button-type='AUXILIARY_ALT']").toArray();
  
  if (button[0] === undefined) {
    console.error("Button[0] is undefined!", button);
    return Promise.reject();
  }
  
  button[0].click();
  return Promise.resolve();
}

function isPopupOpen(message) {
  let button = $("button[title='Close'], button[title='Cancel'][data-automation-button-type='AUXILIARY_ALT']");
  
  return button.length !== 0;
}


function isPopupEnterTime() {
  return document.title.includes("Enter Time");
}


function readEnterTimePopup(message) {
  let date = $("div[data-automation-id='pageHeaderTitle']").children("div").text();
  let type = $("p[data-automation-id='promptOption']").text();
  let hours = $("input[data-automation-id='numericInput']").val();
  let comment = $("textarea[data-automation-id='textAreaField']").val();
  
  return Promise.resolve({date, type, hours, comment});
}

function readTimeBlockPopup(message) {
  let activeTab = $("li[data-automation-id='selectedTab']");
  
  if (activeTab.text() !== "Reported") {
    Promise.reject("Invalid Block");
  }
  
  let date = $("label:contains('Date')").parent().next().text();
  let type = $("label:contains('Time Entry Code')").parent().next().text();
  let hours = $("label:contains('Reported Quantity')").parent().next().text();
  let comment = $("label:contains('Comment')").parent().next().text();
  
  return Promise.resolve({date, type, hours, comment});
}

