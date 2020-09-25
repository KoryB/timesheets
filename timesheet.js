let months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let invalidTypes = ["Paid Holiday", "Meal/Break"];


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function createNotification(message) {
  console.log('creating notification', message);
  browser.notifications.create("notification", {
    "type": "basic",
    "iconUrl": browser.runtime.getURL("icons/timesheet-96.png"),
    "title": "CY Timesheet Transferring",
    "message": message
  });
}


function validateTabs() {
  return browser.tabs.query({status: "complete"})
    .then(tabs => new Promise((resolve, reject) => {      
      let titles = tabs.map((tab) => tab.title);
      let workdayRegex = /.*- Workday/g;
      let oncorpsRegex = /OnCorps(.|\n)*Americorps - OhioExtranet(.|\n)*/g;
      
      let validationResponse = {
        valid: true,
        messages: []
      };
      
      console.log(`Found tabs ${titles}`);
      
      if (!titles.some((title) => workdayRegex.test(title))) {
          validationResponse.valid = false,
          validationResponse.messages.push("You must have the workday time entering page open");
      }
      
      if (!titles.some((title) => oncorpsRegex.test(title))) {
          validationResponse.valid = false,
          validationResponse.messages.push("You must have the oncorps time entering page open");
      }
      
      resolve(validationResponse);
    }));
}


function validateWorkdayResponse(response) {
  var validationResponse = {
    valid: true,
    messages: []
  };
  
  if (invalidTypes.includes(response.type)) {
    validationResponse.valid = false;
    validationResponse.messages.push(`Invalid type: ${response.type}`);
    
    if (response.type === "Paid Holiday") {
      createNotification(`WARNING: Paid holidays must be entered manually. In the comment box for ${response.date} type "Paid Holiday - <holiday name>"`);
    }
  }
  
  if (Number.isNaN(response.hours)) {
    validationResponse.valid = false;
    validationResponse.messages.push("Invalid parse, hours cannot be NaN");
  }
  
  return validationResponse;
}


function convertWorkdayDate(response) {
  let date = response.date;
  let month = months[parseInt(date.split("/")[0])];
  let dayInt = date.split("/")[1];
  let day = dayInt.padStart(2, "0");
  
  return `${month} ${day}`;
}


function convertWorkdayResponse(response) {
  console.log("enter convertWorkdayResponse", response);
  
  response.date = convertWorkdayDate(response);
  response.hours = parseFloat(response.hours);
  response.initialComment = "PD with teacher";
  response.command = "record-hours";
                  
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
  
  console.log(response);

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
  
  return browser.tabs.query({title: "OnCorps*Americorps - OhioExtranet*"})
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
  console.log("Starting transferAllBoxes");
  
  return validateTabs().then(response => new Promise( (resolve, reject) => {
    if (!response.valid) {
      reject(response.messages);
    } 
    
    resolve();
  }))
  .then(() => new Promise( (resolve, reject) => {
    browser.tabs.query({title: "Review Time by Week - Workday"})
    .then(function(tabs) {
      let tab = tabs[0];
      let transfer = tab.title.includes("Review Time by Week") ? transferAllBoxesByWeek : transferAllBoxesIndividually;
      
      console.log("Notifying Workday Tab");
      transfer(tab)      
      .then(resolve);
    });
  }));
}

function transferAllBoxesIndividually(tab) {
  return browser.tabs.sendMessage(tab.id, {command: "queue-boxes"})
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
        .then(() => browser.tabs.sendMessage(tab.id, {command: "close-popup"}))
        .catch(() => {});
        
      } while (numBoxesLeft > 0)
    });
}

function transferAllBoxesByWeek(tab) {
  return browser.tabs.sendMessage(tab.id, {command: "read-table"})
  .then(table => {
    for (let row of table) {
      let message = convertWorkdayResponse(row);
      notifyOncorps(message)
    }
  });
}

function clearAllBoxes() {
  console.log("Clearing boxes");
  
  return validateTabs().then(response => new Promise( (resolve, reject) => {
    if (!response.valid) {
      createNotification(response.messages.join(" "));
      reject(response.messages);
    } 
    
    resolve();
  }))
  .then(() => new Promise( (resolve, reject) => {
    browser.tabs.query({title: "*- Workday"})
    .then(function(tabs) {
      let tab = tabs[0];
      console.log("Notifying Workday Tab", tab);
      
      browser.tabs.sendMessage(tab.id, {command: "get-dates"})
      .then(async (dates) => {
        console.log(`Found dates: ${dates}`);
        
        for (let date of dates) {
          let message = {date: convertWorkdayDate({date}), command: "clear-hours"}
          
          await browser.tabs.query({title: "OnCorps*Americorps - OhioExtranet*"})
          .then(function(tabs) {
            for (let tab of tabs) {        
              console.log("Notifying Oncorps Tab: ", message);
              browser.tabs.sendMessage(tab.id, message);
            }
          });
        }
      })
    })
  }))
}


browser.runtime.onMessage.addListener((message) => {
  switch (message) {
    case "transfer-all-boxes":
      return transferAllBoxes();
    case "clear-all-boxes":
      return clearAllBoxes();
    default:
      break;
  }
});

