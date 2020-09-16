function listenForClicks() {
  document.addEventListener("click", (e) => {
    function changeMessage(message) {
      $("div#popup-content").addClass("hidden")
      
      $("p#error-message").removeClass("hidden").text(message)
    }

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("transfer")) {
      browser.runtime.sendMessage("transfer-all-boxes")
      .then(() => changeMessage("Successfully transferred!"))
      .catch(error => changeMessage(error.join('! ')));
    }
    else if (e.target.classList.contains("clear")) {
      browser.runtime.sendMessage("clear-all-boxes")
      .then(() => changeMessage("Successfully cleared!"))
      .catch(error => changeMessage(error));
    }
    
    window.close();
  });
}

listenForClicks();
