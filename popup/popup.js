/* -------------    Global Variables     ----------------- */

let hasPaidGlobal = null
let numberOfNotesGlobal = null

/* -------------    Message Listener     ----------------- */

chrome.runtime.onMessage.addListener(messageReceived)

function messageReceived(msg) {
    if (msg.action === "formSubmitted") {
        // Clear form inputs
        keywordInput.value = ""
        noteInput.value = ""
        showOnceCheckbox.checked = false
        counterCheckbox.checked = false
    } else if (msg.action === "checkIfUserHasFullVersionAnswer") {
        hasPaidGlobal = msg.data
    } else if (msg.action === "getNumberOfNotesAnswer") {
        numberOfNotesGlobal = msg.data
    }
}

/* -------------    Free / Full Version     ----------------- */

function getGlobalVariables() {
    chrome.runtime.sendMessage({ action: "checkIfUserHasFullVersion" })
    chrome.runtime.sendMessage({ action: "getNumberOfNotes" })
}
getGlobalVariables()

/* -------------    Popup Elements     ----------------- */

const form = document.getElementById("form")
const keywordInput = document.querySelector("#keyword-input")
const noteInput = document.querySelector("#note-input")
const showOnceCheckbox = document.querySelector("#showOnce")
const counterCheckbox = document.querySelector("#counter")

const showAllNotesButton = document.querySelector("#show-all-notes-btn")

/* -------------    Handle Checkboxes     ----------------- */

// When one checkbox is checked, the other is disabled

counterCheckbox.addEventListener("change", () => {
    if (counterCheckbox.checked) {
        showOnceCheckbox.checked = false
        showOnceCheckbox.disabled = true
    } else {
        showOnceCheckbox.checked = false
        showOnceCheckbox.disabled = false
    }
})

showOnceCheckbox.addEventListener("change", () => {
    if (showOnceCheckbox.checked) {
        counterCheckbox.checked = false
        counterCheckbox.disabled = true
    } else {
        counterCheckbox.checked = false
        counterCheckbox.disabled = false
    }
})

/* -------------    When 'Add Note' is clicked     ----------------- */

form.addEventListener("submit", async (event) => {
    event.preventDefault()

    if (!hasPaidGlobal && numberOfNotesGlobal >= 2) {
        getFullVersionNotification()
        return
    }
    if (!hasPaidGlobal) {
        numberOfNotesGlobal += 1
    }

    // Retrieve form values
    const keyword = keywordInput.value
    const note = noteInput.value
    const showOnce = showOnceCheckbox.checked
    const counter = counterCheckbox.checked
    let counterCount = 0

    // Create an object with the form data
    const formData = {
        keyword,
        note,
        showOnce, // boolean
        counter, // boolean
        counterCount,
    }

    // Send the form data to service-worker.js
    await chrome.runtime.sendMessage({
        action: "submitForm",
        data: formData,
    })

    // Note added successfully notification
    notification()
})

/* -------------    Show All Notes     ----------------- */

showAllNotesButton.addEventListener("click", async () => {
    // Send message to s-w to open options.html
    await chrome.runtime.sendMessage({ action: "openOptions" })
})

/* -------------    Notification     ----------------- */

// "Note Added Successfully" notification
function notification() {
    const notificationElement = document.querySelector("#notification")

    // If you add two notes in a row, the notification will already have a span
    const notificationHasSpan = notificationElement.querySelector("span")
    if (notificationHasSpan) {
        notificationElement.style.display = ""
    } else {
        // Create a span element to wrap the text
        const textNode = document.createElement("span")
        textNode.appendChild(
            document.createTextNode("Note Added Successfully!")
        )

        // Apply the CSS class to the span
        textNode.classList.add("notificationText")

        // Append the styled text to the notification element
        notificationElement.appendChild(textNode)
    }

    setTimeout(() => {
        notificationElement.style.display = "none"
    }, 4000)
}

function getFullVersionNotification() {
    // Hide the form
    const formContainer = document.querySelector(".form")
    formContainer.style.display = "none"

    // Show the getFullVersionNotificationContainer
    const getFullVersionNotificationContainer = document.querySelector(
        ".getFullVersionNotificationContainer"
    )

    // Add the "show" class to trigger the animation
    getFullVersionNotificationContainer.classList.add("show")

    // Modify the show-all-notes-btn
    const showAllNotesButton = document.querySelector("#show-all-notes-btn")

    // Apply the styles
    showAllNotesButton.style.display = "inline-block"
    showAllNotesButton.style.border = "none"
    showAllNotesButton.style.borderRadius = "30px"
    showAllNotesButton.style.border = "1px solid rgba(255, 255, 255, 0.718)"
    showAllNotesButton.style.cursor = "pointer"
    showAllNotesButton.style.backgroundColor = "rgb(69, 69, 224)"
    showAllNotesButton.style.color = "#ffffff"
    showAllNotesButton.style.boxShadow =
        "0 0 5px 0.3rem rgba(0, 123, 255, 0.25)"
    showAllNotesButton.style.transition =
        "background-color 0.3s, border-color 0.3s"

    // Hover styles
    showAllNotesButton.addEventListener("mouseover", function () {
        showAllNotesButton.style.backgroundColor = "rgba(69, 69, 224, 0.524)"
        showAllNotesButton.style.border = "1px solid rgba(69, 69, 224, 0.524)"
        showAllNotesButton.style.color = "#fff"
    })

    // Reset styles on mouseout
    showAllNotesButton.addEventListener("mouseout", function () {
        showAllNotesButton.style.backgroundColor = "rgb(69, 69, 224)"
        showAllNotesButton.style.border = "1px solid rgba(255, 255, 255, 0.718)"
        showAllNotesButton.style.color = "#ffffff"
    })

    // Focus styles
    showAllNotesButton.addEventListener("focus", function () {
        showAllNotesButton.style.outline = "none"
    })

    // Remove focus styles on blur
    showAllNotesButton.addEventListener("blur", function () {
        showAllNotesButton.style.outline = "none"
    })
}
