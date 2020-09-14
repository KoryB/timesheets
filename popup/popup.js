function listenForClicks() {
  document.addEventListener("click", (e) => {
    function reportError(error) {
      console.error(`Could not transfer: ${error}`);
    }

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("transfer")) {
      transferAllBoxes()
      .catch(reportError)
    }
    else if (e.target.classList.contains("clear")) {
      console.info("clear");
    }
  });
}

listenForClicks();
