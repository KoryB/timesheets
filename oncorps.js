browser.runtime.onMessage.addListener(notify);


function notify(message) {
  switch (message.command) {
    case "record-hours":
      return recordHours(message);
    case "clear-hours":
      return clearHours(message);
    default:
      break;
  }
}


function getHoursInput(row, type) {
  let hoursIndex = type.includes("Service")
    ? 2
    : 1;
    
  return row.eq(hoursIndex).children("input");
}

function parseHours(hoursInput) {
  var hours = parseFloat(hoursInput.val());
  
  if (hours === parseFloat("") || Number.isNaN(hours)) {
    hours = 0;
  }
  
  return hours;
}

function setInitialComment(commentTextArea, initialComment) {
  if (commentTextArea.val() === "") {
    commentTextArea.val(initialComment);
  }
}

function writeEntry({hoursInput, commentTextArea}, {hours, comment, initialComment}) {
  console.log("Writing Entry:", {hoursInput, commentTextArea, hours, comment});
  
  let currentHours = parseHours(hoursInput);
  
  setInitialComment(commentTextArea, initialComment);
  commentTextArea.val(commentTextArea.val() + "\n\n" + comment);
  
  hoursInput.val(currentHours + hours);
}


function recordHours({date, type, hours, comment, initialComment}) {
  console.log("Enter recordHours... args: ", {date, type, hours, comment, initialComment});
  
  let inputRow = $(`span:contains(${date})`).parent().parent();
  let commentTextArea = inputRow.next().children().eq(1).children("textarea");
  
  let row = inputRow.children();
  let hoursInput = getHoursInput(row, type);
  
  writeEntry({hoursInput, commentTextArea}, {hours, comment, initialComment});
}


function clearHours({date}) {
  console.log("Enter clearHours... args: ", {date});
  
  let inputRow = $(`span:contains(${date})`).parent().parent();
  let commentTextArea = inputRow.next().children().eq(1).children("textarea");
  let hoursInputs = inputRow.find("input");
  
  console.log(commentTextArea)
  console.log(hoursInputs)
  
  commentTextArea.text("");
  hoursInputs.val("");
}
