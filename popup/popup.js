var isClicked = false;

function listenForClicks() {
  document.addEventListener("click", (e) => {
    function changeMessage(message) {
      // $("div#popup-content").addClass("hidden")
      
      // $("p#error-message").removeClass("hidden").text(message)
    }

    if (! isClicked) {
      isClicked = true;
      
      if (e.target.classList.contains("transfer")) {
        browser.runtime.sendMessage("transfer-all-boxes")
        .then(() => changeMessage("Successfully transferred!"))
        .catch(error => changeMessage(error));
      }
      else if (e.target.classList.contains("clear")) {
        browser.runtime.sendMessage("clear-all-boxes")
        .then(() => changeMessage("Successfully cleared!"))
        .catch(error => changeMessage(error));
      }
    
      window.close();
    }
  });
}

listenForClicks();
