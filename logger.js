var fs = require('fs');

let file_location = "";

function dateLog(...message) {
    const date = new Date().toISOString();
    let date_string = date.slice(0, 10);
    let time_string = date.slice(11, 19);

    const processedMessages = message.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return '[Object]';
            }
        }
        return arg;
    });

    let messageString = date_string + " " + time_string + " UTC: " + processedMessages.join(" ");
    console.log(messageString);

    if (file_location !== "") {
        fs.appendFileSync(file_location, messageString + "\n");
    }
}

function loadLogger() {
    let date = new Date().toISOString();
    let date_string = date.slice(0, 10);
    let time = date.slice(11, 19);
    time = time.split(":").join("-");
    file_location = __dirname + "/logs/log-" + date_string + "-" + time + ".log";
    try {
        fs.openSync(file_location, 'a');
        fs.appendFileSync(file_location, "Log file created at " + date_string + " " + time + " UTC\n");
    } catch (error) {
        file_location = "";
        dateLog("Failed to create log file:", error.message);
    }
}

module.exports = {
    dateLog, loadLogger
}