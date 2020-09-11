let months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let invalidTypes = ["Paid Holiday", "Meal/Break"];


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function validateWorkdayResponse(response) {
  var validationResponse = {
    valid: true,
    messages: []
  };
  
  if (invalidTypes.includes(response.type)) {
    validationResponse.valid = false;
    validationResponse.messages.push(`Invalid type: ${response.type}`);
  }
  
  return validationResponse;
}

function convertWorkdayResponse(response) {
  function convertDate(response) {
    let date = response.date;
    let month = months[parseInt(date.split("/")[0])];
    let day = date.split("/")[1];
    
    return `${month} ${day}`;
  }
  
  response.date = convertDate(response);
  response.hours = parseFloat(response.hours);
  response.initialComment = "PD with teacher";
                  
  return response;
}


async function readWorkdayPopup(tab) {
  let response = {};

  for (let i = 0; i < 30; i++) {
    response = await 
      delay(250)
      .then(() => browser.tabs.sendMessage(tab.id, {command: "read-popup"}))
    
    if (response.date !== "") {
      break;
    }
  }

  return Promise.resolve(response);
}

async function waitForPopupToClose(tab) {
  let isPopupOpen = {};

  for (let i = 0; i < 30; i++) {
    isPopupOpen = await 
      delay(250)
      .then(() => browser.tabs.sendMessage(tab.id, {command: "is-popup-open"}))
    
    if (!isPopupOpen) {
      break;
    }
  }

  return Promise.resolve(response);
}


function notifyOncorps(message) {
  let validationResponse = validateWorkdayResponse(message);
  
  if (!validationResponse.valid) {
    console.log("Invalid message: ", validationResponse.messages);
    
    return;
  }
  
  browser.tabs.query({title: "OnCorps*Americorps - OhioExtranet*"})
    .then(function(tabs) {
      for (let tab of tabs) {        
        console.log("Notifying Oncorps Tab: ", message);
        browser.tabs.sendMessage(tab.id, message);
      }
    });
}

function transferDay() {
  browser.tabs.query({title: "*- Workday"})
    .then(function(tabs) {
      for (let tab of tabs) {
        console.log("Notifying Workday Tab");
        
        browser.tabs.sendMessage(tab.id, {command: "read-popup"})
          .then(function(response) {
            let message = convertWorkdayResponse(response);
            
            notifyOncorps(message);
        });
      }
    });
}


function transferAllBoxes() {
  browser.tabs.query({title: "*- Workday"})
    .then(function(tabs) {
      for (let tab of tabs) {
        console.log("Notifying Workday Tab");
        
        browser.tabs.sendMessage(tab.id, {command: "queue-boxes"})
        .then(async () => {
          let numBoxesLeft = 0;
          
          do {
            numBoxesLeft = await 
              delay(2000)
              .then(() => {
                return browser.tabs.sendMessage(tab.id, {command: "click-current-box"})
              });
            
            await readWorkdayPopup(tab)
            .then((response) => {
              let message = convertWorkdayResponse(response);
              
              notifyOncorps(message);
            })
            .then(() => browser.tabs.sendMessage(tab.id, {command: "close-popup"}));
            
          } while (numBoxesLeft > 0)
        });
      }
    });
}


function testAutoClick() {
  browser.tabs.query({title: "*- Workday"})
    .then(function(tabs) {
      for (let tab of tabs) {
        console.log("Notifying Workday Tab");
        
        browser.tabs.sendMessage(tab.id, {command: "queue-boxes"})
        .then(() => browser.tabs.sendMessage(tab.id, {command: "click-current-box"}))
        .then(() => readWorkdayPopup(tab))
        .then(response => {
          console.log(response);
        })
        .then(() => browser.tabs.sendMessage(tab.id, {command: "close-popup"}));
      }
    });
}

