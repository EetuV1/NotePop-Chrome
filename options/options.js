/* ---------------------    Global Variables    -------------------------- */

let hasPaidGlobal = null
let numberOfNotesGlobal = null

/* ---------------------    Message Listener    -------------------------- */

chrome.runtime.onMessage.addListener(messageReceived)

function messageReceived(msg) {
    if (msg.action === "formSubmitted") {
        // Clear form inputs
        keywordInput.value = ""
        noteInput.value = ""
        showOnceCheckbox.checked = false
        counterCheckbox.checked = false

        // Gives time to save the data before getting it
        // How else to do this??
        setTimeout(function () {
            showNoteList()
        }, 100)

        // Just to check if have to show addNote or addNoteDecline btn
        chrome.runtime.sendMessage({ action: "checkIfUserHasFullVersion" })
    } else if (msg.action === "checkIfUserHasFullVersionAnswer") {
        const hasPaid = msg.data
        const getFullVersionContainer = document.querySelector(
            ".getFullVersionContainer"
        )
        hasPaidGlobal = hasPaid
        if (hasPaid) {
            // Hide the get full version container
            getFullVersionContainer.style.display = "none"
        } else {
            // Show the buy full version container
            getFullVersionContainer.style.display = "flex"
            // If two notes are added, hide the add note button, and show the decline button
            chrome.runtime.sendMessage({ action: "getNumberOfNotes" }) // => s-w
        }
    } else if (msg.action === "getNumberOfNotesAnswer") {
        const numberOfNotes = msg.data
        numberOfNotesGlobal = numberOfNotes
    }
}

/* ---------------------    Options Page    ----------------------------- */

async function showNoteList() {
    const allNotesListElement = document.getElementById("allNotesListElement")
    // Clear the element - for refresh
    allNotesListElement.innerHTML = ""

    // Call getAllNotes and provide a callback function to handle the dataList
    getAllNotes(function (dataList) {
        if (dataList.children.length > 0) {
            allNotesListElement.appendChild(dataList)
        } else {
            const noDataText = document.createTextNode("No Notes Added...")
            allNotesListElement.appendChild(noDataText)
        }
    })
}

// When page is loaded it will get the list
showNoteList()

//  Show notes on the options page
function getAllNotes(callback) {
    chrome.storage.local.get("notes", function (allResults) {
        const dataList = document.createElement("ul")

        const result = allResults.notes

        // Iterate through the retrieved data
        for (const key in result) {
            if (result.hasOwnProperty(key)) {
                const listItem = document.createElement("div")
                const checkboxDiv = document.createElement("div")
                checkboxDiv.classList.add("checkboxDiv")
                const listItemBtns = document.createElement("li")

                const keywordText = document.createElement("h3")
                const keyword = document.createElement("h2")
                const noteText = document.createElement("h3")
                const note = document.createElement("h2")
                const showOnceText = document.createElement("h3")
                const showOnce = document.createElement("h2")
                const counterText = document.createElement("h3")
                const counter = document.createElement("h2")
                const deleteBtn = document.createElement("button")

                const keywordBox = document.createElement("div")
                keywordBox.classList.add("keywordDiv")
                const noteBox = document.createElement("div")
                noteBox.classList.add("noteDiv")
                const showOnceBox = document.createElement("div")
                showOnceBox.classList.add("showOnceDiv")
                const counterBox = document.createElement("div")
                counterBox.classList.add("counterDiv")
                const deleteBtnBox = document.createElement("div")
                deleteBtnBox.classList.add("deleteBtnDiv")

                keywordText.textContent = "Keyword:"
                keyword.textContent = result[key].keyword
                noteText.textContent = "Note:"
                note.textContent = result[key].note
                showOnceText.textContent = "Show Once:"
                showOnce.textContent = result[key].showOnce ? "✅" : "➖"
                counterText.textContent = "Counter:"
                counter.textContent = result[key].counter
                    ? result[key].counterCount
                    : "➖"
                deleteBtn.textContent = "Delete"

                keywordBox.appendChild(keywordText)
                keywordBox.appendChild(keyword)
                noteBox.appendChild(noteText)
                noteBox.appendChild(note)
                showOnceBox.appendChild(showOnceText)
                showOnceBox.appendChild(showOnce)
                counterBox.appendChild(counterText)
                counterBox.appendChild(counter)
                deleteBtnBox.appendChild(deleteBtn)

                checkboxDiv.appendChild(showOnceBox)
                checkboxDiv.appendChild(counterBox)
                checkboxDiv.appendChild(deleteBtnBox)

                listItem.appendChild(keywordBox)
                listItem.appendChild(noteBox)
                listItem.appendChild(checkboxDiv)

                listItemBtns.appendChild(listItem)

                dataList.appendChild(listItemBtns)

                deleteBtn.addEventListener("click", function () {
                    deleteNote(key)
                })
            }
        }

        callback(dataList)
    })
}

function deleteNote(key) {
    const confirmation = window.confirm(
        "Are you sure you want to delete this note?"
    )
    if (confirmation) {
        chrome.storage.local.get("notes", function (results) {
            const result = results.notes
            delete result[key]

            chrome.storage.local.set({ notes: result }, function () {
                showNoteList()
                numberOfNotesGlobal -= 1
            })
        })
    }
}

/* ----------------------   Free/Full Version    --------------------------- */

chrome.runtime.sendMessage({ action: "checkIfUserHasFullVersion" })

/* ---  Refresh Window Popup Window   --- */
const afterPurchaseRefreshBtn = document.getElementById(
    "afterPurchaseRefreshBtn"
)

afterPurchaseRefreshBtn.addEventListener("click", async () => {
    location.reload()
})

const refreshContainerCloseBtn = document.getElementById(
    "refreshContainerCloseBtn"
)

const afterPurchaseRefreshContainer = document.querySelector(
    ".afterPurchaseRefreshContainer"
)

refreshContainerCloseBtn.addEventListener("click", async () => {
    afterPurchaseRefreshContainer.style.display = "none"
})

/* ---  Buy Full Version Btn    --- */
const buyFullVersionBtn = document.querySelector("#buyFullVersionBtn")
buyFullVersionBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({
        action: "buyFullVersionBtnClicked",
    })
    setTimeout(function () {
        afterPurchaseRefreshContainer.style.display = "flex"
    }, 3000)
})

/* ----------------------   FORM    --------------------------- */

const form = document.getElementById("form")
const keywordInput = document.querySelector("#keyword-input")
const noteInput = document.querySelector("#note-input")
const showOnceCheckbox = document.querySelector("#showOnce")
const counterCheckbox = document.querySelector("#counter")

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

// Sends the formData to service-worker.js
form.addEventListener("submit", async (event) => {
    event.preventDefault()

    if (!hasPaidGlobal && numberOfNotesGlobal >= 2) {
        alert(
            "You have reached the maximum number of notes in this free version. Please buy the full version to add more notes or delete some of your old notes.\nThank You for using NotePop!"
        )
        return
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
})
