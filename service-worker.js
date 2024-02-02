/*
Copyright © 2023 Eetu Valkamo

All rights reserved. This code is the property of the copyright holder 
and may not be used, modified, or distributed without explicit 
written permission from the copyright holder.
*/

/* -----------  Message listener    ---------------------- */

chrome.runtime.onMessage.addListener(messageReceived)

async function messageReceived(msg) {
    if (msg.action === "submitForm") {
        saveFormData(msg.data)
        await chrome.runtime.sendMessage({ action: "formSubmitted" })
    } else if (msg.action === "openOptions") {
        chrome.tabs.create({
            url:
                "chrome-extension://" +
                chrome.runtime.id +
                "/options/options.html",
        })
    } else if (msg.action === "checkIfUserHasFullVersion") {
        const hasPaid = await checkIfUserHasPaid()
        await chrome.runtime.sendMessage({
            action: "checkIfUserHasFullVersionAnswer",
            data: hasPaid,
        })
    } else if (msg.action === "buyFullVersionBtnClicked") {
        // Open the payment page
        buyFullVersionBtnClicked()
    } else if (msg.action === "getNumberOfNotes") {
        const numberOfNotes = await getNumberOfNotes()
        await chrome.runtime.sendMessage({
            action: "getNumberOfNotesAnswer",
            data: numberOfNotes,
        })
    }
}

/* -----------  After Downloaded or Updated    ---------------------- */

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        console.log("Extension installed.")
        // Set up the storage
        chrome.storage.local.clear(function () {
            chrome.storage.local.set({
                notes: {},
                settings: {},
                showedOnce: {},
            })
        })
        startExtPay()
        // Open the options page?
    } else if (details.reason === "update") {
        console.log("Extension updated.")

        startExtPay()
    }
})

/* -----------  Free/Full Version    ---------------------- */

import ExtPay from "/ExtPay.js"

async function startExtPay() {
    // there should be a working internet connection
    // because the user has updated or installed the extension
    try {
        const extpay = await ExtPay("notepoptest")
        extpay.startBackground() // Can be called only once

        const user = await extpay.getUser()

        // later on when there is no internet connection, this should be useful
        // could be manipulated by the user...
        await chrome.storage.local.set({ settings: { ExtPay: user } })
    } catch (error) {
        console.error("startExtPay catch error: ", error)
    }
}

function offlineGetPaid() {
    return new Promise((resolve) => {
        chrome.storage.local.get("settings", (result) => {
            const hasPaid = result.settings?.ExtPay?.paid
            resolve(hasPaid)
        })
    })
}

async function checkIfUserHasPaid() {
    try {
        const extpay = await ExtPay("notepoptest")
        const user = await extpay.getUser()

        return user.paid
    } catch (error) {
        // probably no internet connection or the server doesnt answer
        // get the data from storage
        console.error("checkIfUserHasPaid catch error: ", error)

        const hasPaid = await offlineGetPaid()

        return hasPaid
    }
}

async function buyFullVersionBtnClicked() {
    const extpay = await ExtPay("notepoptest")
    extpay.openPaymentPage()
}

function getNumberOfNotes() {
    return new Promise((resolve) => {
        chrome.storage.local.get("notes", (result) => {
            const numberOfNotes = Object.keys(result.notes).length

            resolve(numberOfNotes)
        })
    })
}

/* -----------  Save Form Data    ---------------------- */

function saveFormData(formData) {
    const dataId = generateUniqueId(formData.keyword)

    getStoredData((allData) => {
        const newNote = formData

        allData.notes[dataId] = newNote

        // Updating the storage
        chrome.storage.local.set({ notes: allData.notes }, function () {})
    })
}

function generateUniqueId(keyword) {
    const timestamp = Date.now()
    return `${timestamp}_${keyword}`
}

/* -----------  Get Stored Data   ---------------------- */

function getStoredData(callback) {
    chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError)
            callback([])
        } else {
            callback(result || [])
        }
    })
}

/* -----------  Keyword Listener    ---------------------- */

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const url = new URL(changeInfo.url)
        // In (Google) url the 'q=' is for queryParam - that's the searched word
        const queryParam = url.searchParams.get("q")

        if (queryParam) {
            // Retrieve keywords from chrome.storage
            getStoredData((allData) => {
                const allNotes = allData.notes

                const lowerCaseQueryParam = queryParam.toLowerCase()

                for (const noteId in allNotes) {
                    const note = allNotes[noteId]
                    const lowerCaseKeyword = note.keyword.toLowerCase()

                    if (lowerCaseQueryParam.includes(lowerCaseKeyword)) {
                        keywordMatch(note, noteId)
                    }
                }
            })
        }
    }
})

/* -----------  Keyword Match    ---------------------- */

function keywordMatch(note, noteId) {
    // If counter -> add +1 to counterCount
    if (note.counter === true) {
        chrome.storage.local.get("notes", function (notes) {
            const results = notes.notes
            results[noteId].counterCount += 1

            chrome.storage.local.set({ notes: results }, function () {})
        })
    }
    // send match notification
    chrome.notifications.create(
        {
            type: "basic",
            iconUrl: "assets/48.png",
            title: `Keyword Match: ${note.keyword}`,
            message:
                note.counter === true
                    ? `
Counter: ${note.counterCount + 1}
${note.note}`
                    : `
${note.note}`,
            buttons: [{ title: "OK" }, { title: "Show Notes" }],
        },
        (notificationId) => {
            chrome.notifications.onButtonClicked.addListener(
                (notificationId, buttonIndex) => {
                    if (notificationId === notificationId) {
                        if (buttonIndex === 0) {
                            // "OK" button clicked
                            chrome.notifications.clear(notificationId)
                        } else if (buttonIndex === 1) {
                            // "Show Notes" button clicked
                            chrome.notifications.clear(notificationId)
                            // Open options.html
                            chrome.tabs.create({
                                url:
                                    "chrome-extension://" +
                                    chrome.runtime.id +
                                    "/options/options.html",
                            })
                        }
                    }
                }
            )
        }
    )

    // if showOnce -> delete note from notes, and add it to showedOnce
    if (note.showOnce) {
        // Activate this when you handle the showedOnce notes, for now - just delete

        // // Add the note to showedOnce
        // chrome.storage.local.get("showedOnce", function (allResults) {
        //     const result = allResults.showedOnce
        //     result[noteId] = note
        //     chrome.storage.local.set({ showedOnce: result }, function () {
        //         // Delete the note from notes
        //         chrome.storage.local.get("notes", function (allResults) {
        //             const result = allResults.notes
        //             delete result[noteId]
        //             chrome.storage.local.set({ notes: result }, function () {})
        //         })
        //     })
        // })

        // Delete the note from notes
        chrome.storage.local.get("notes", function (allResults) {
            const result = allResults.notes
            delete result[noteId]
            chrome.storage.local.set({ notes: result }, function () {})
        })
    }
}
