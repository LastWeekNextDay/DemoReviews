const fs = require('fs');
const {dateLog} = require("./logger");

let registration_mapping_location = "";
let queue_location = "";

function loadItemRegistration() {
    queue_location = __dirname + "/reg/queue.json";
    registration_mapping_location = __dirname + "/reg/registration_mapping.json";
    try {
        fs.openSync(queue_location, 'a');
        fs.openSync(registration_mapping_location, 'a');
        if (fs.readFileSync(queue_location, 'utf-8') === "") {
            fs.appendFileSync(queue_location, "[]");
        }
        if (fs.readFileSync(registration_mapping_location, 'utf-8') === "") {
            fs.appendFileSync(registration_mapping_location, "[]");
        }
    } catch (error) {
        queue_location = "";
        registration_mapping_location = "";
        dateLog("Failed to create item registration files:", error.message);
    }
}

function queueRegistration(proposedItemName, domain) {
    let queue = getQueue();
    queue.push({
        proposedItemName: proposedItemName,
        domain: domain
    });
    fs.writeFileSync(queue_location, JSON.stringify(queue, null, 2));
}

function getQueue() {
    return JSON.parse(fs.readFileSync(queue_location, 'utf-8'));
}

function getRegistrationMapping() {
    return JSON.parse(fs.readFileSync(registration_mapping_location, 'utf-8'));
}

function removeRegistrationFromQueue(proposedItemName, domain) {
    let queue = getQueue();
    let newQueue = [];
    for (let i = 0; i < queue.length; i++) {
        if (queue[i].proposedItemName !== proposedItemName || queue[i].domain !== domain) {
            newQueue.push(queue[i]);
        }
    }
    fs.writeFileSync(queue_location, JSON.stringify(newQueue, null, 2));
}

function assignRegistrationToItem(proposedItemName, domain, itemName) {
    let registration_mapping = getRegistrationMapping();
    registration_mapping.push({
        proposedItemName: proposedItemName,
        domain: domain,
        itemName: itemName
    });
    fs.writeFileSync(registration_mapping_location, JSON.stringify(registration_mapping, null, 2));
}

function checkRegistration(proposedItemName, domain) {
    let registration_mapping = getRegistrationMapping();
    for (let i = 0; i < registration_mapping.length; i++) {
        if (registration_mapping[i].proposedItemName === proposedItemName && registration_mapping[i].domain === domain) {
            return registration_mapping[i].itemName;
        }
    }
    return null;
}

function checkQueue(proposedItemName, domain) {
    let queue = getQueue();
    for (let i = 0; i < queue.length; i++) {
        if (queue[i].proposedItemName === proposedItemName && queue[i].domain === domain) {
            return true;
        }
    }
    return false;
}

module.exports = {
    loadItemRegistration, checkQueue, queueRegistration, assignRegistrationToItem, checkRegistration, removeRegistrationFromQueue, getQueue, getRegistrationMapping
}