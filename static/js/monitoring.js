let heartRateChart;
let spo2Chart;
let temperatureChart;

let chartLabels = [];

let heartRateData = [];
let spo2Data = [];
let temperatureData = [];
let previousStatus = null;
let notificationEnabled = false;


// ==========================================
// GET HEALTH DATA
// ==========================================

async function getHealthData() {

    try {

        const response = await fetch("/api/health");

        const data = await response.json();
        updateCharts(data);

        console.log("Health Data:", data);


        // Update vital values
        document.getElementById("heartRate").textContent =
            data.heart_rate;

        document.getElementById("spo2").textContent =
            data.spo2 + "%";

        document.getElementById("temperature").textContent =
            data.temperature + "°C";

        document.getElementById("bloodPressure").textContent =
            data.blood_pressure;


        // Update health status
        updateHealthStatus(data);


        // Update timestamp
        document.getElementById("lastUpdate").textContent =
            "Last update: " + data.timestamp;


        // Check for status change
        handleHealthAlert(data);


    } catch (error) {

        console.error(
            "Failed to receive health data:",
            error
        );

    }
}


// ==========================================
// UPDATE HEALTH STATUS
// ==========================================

function updateHealthStatus(data) {

    const statusElement =
        document.querySelector(".status");

    const alertElement =
        document.querySelector(".alert");


    if (data.status === "NORMAL") {

        statusElement.textContent =
            "🟢 STABLE";

        statusElement.style.background =
            "#123b2b";

        statusElement.style.color =
            "#4dff9b";


        alertElement.innerHTML = `
            🚨 Alert Center
            <br><br>
            No critical alerts currently detected.
        `;

    }


    else if (data.status === "WARNING") {

        statusElement.textContent =
            "🟡 WARNING";

        statusElement.style.background =
            "#403714";

        statusElement.style.color =
            "#ffd84d";


        alertElement.innerHTML = `
            ⚠️ Alert Center
            <br><br>
            ${data.warnings.join("<br>")}
        `;

    }


    else if (data.status === "CRITICAL") {

        statusElement.textContent =
            "🔴 CRITICAL";

        statusElement.style.background =
            "#45151b";

        statusElement.style.color =
            "#ff6675";


        alertElement.innerHTML = `
            🚨 CRITICAL ALERT
            <br><br>
            ${data.critical.join("<br>")}
        `;

    }

}


// ==========================================
// HEALTH ALERT DETECTION
// ==========================================

async function handleHealthAlert(data) {

    // First reading
    if (previousStatus === null) {

        previousStatus = data.status;

        return;
    }


    // Nothing changed
    if (data.status === previousStatus) {

        return;
    }


    console.log(
        "Health status changed:",
        previousStatus,
        "→",
        data.status
    );


    // WARNING
    if (data.status === "WARNING") {

        const message =
            data.warnings.join(", ");

        sendHealthNotification(
    "WARNING",
    message
);

showMissionAlert(
    "WARNING",
    message,
    data.timestamp
);

await saveAlert(
    "WARNING",
    message,
    data.timestamp
);
    }


    // CRITICAL
    else if (data.status === "CRITICAL") {

        const message =
            data.critical.join(", ");

        sendHealthNotification(
    "CRITICAL",
    message
);

showMissionAlert(
    "CRITICAL",
    message,
    data.timestamp
);

playEmergencyAlarm();

await saveAlert(
    "CRITICAL",
    message,
    data.timestamp
);
    }


    // RECOVERY
    else if (
        data.status === "NORMAL" &&
        previousStatus !== "NORMAL"
    ) {

        const message =
            "Astronaut health returned to stable range.";

        sendHealthNotification(
            "NORMAL",
            message
        );

        await saveAlert(
            "NORMAL",
            message,
            data.timestamp
        );
    }


    previousStatus = data.status;
}

async function saveAlert(status, message, timestamp) {

    try {

        const response = await fetch(
            "/api/alerts",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    astronaut: "Maya",

                    status: status,

                    message: message,

                    timestamp: timestamp

                })
            }
        );


        const data = await response.json();

        console.log(
            "Alert saved:",
            data
        );


    } catch (error) {

        console.error(
            "Failed to save alert:",
            error
        );
    }
}

// ==========================================
// ENABLE BROWSER NOTIFICATIONS
// ==========================================

async function enableNotifications() {

    if (!("Notification" in window)) {

        alert(
            "This browser does not support notifications."
        );

        return;
    }


    const permission =
        await Notification.requestPermission();


    if (permission === "granted") {

        notificationEnabled = true;

        alert(
            "🔔 ASTRO SENSE notifications enabled."
        );

    }

    else {

        alert(
            "Notifications were not enabled."
        );

    }
}


// ==========================================
// SEND NOTIFICATION
// ==========================================

function sendHealthNotification(status, message) {

    if (!notificationEnabled) {

        return;
    }


    if (Notification.permission !== "granted") {

        return;
    }


    if (status === "WARNING") {

        new Notification(
            "⚠️ ASTRO SENSE WARNING",
            {
                body: message
            }
        );

    }


    else if (status === "CRITICAL") {

        new Notification(
            "🚨 ASTRO SENSE CRITICAL ALERT",
            {
                body: message
            }
        );

    }


    else if (status === "NORMAL") {

        new Notification(
            "🟢 ASTRO SENSE RECOVERY",
            {
                body: message
            }
        );

    }

}


// ==========================================
// EMERGENCY ALARM
// ==========================================

function playEmergencyAlarm() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContext) {

        console.log(
            "Audio not supported."
        );

        return;
    }


    const audioContext =
        new AudioContext();


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.frequency.value = 880;

    oscillator.type = "sine";


    gain.gain.setValueAtTime(
        0.001,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.4,
        audioContext.currentTime + 0.05
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.5
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.5
    );
}


// ==========================================
// SIMULATION CONTROL
// ==========================================

async function setSimulation(mode) {

    try {

        const response = await fetch(
            "/api/simulation",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    mode: mode
                })
            }
        );


        const data = await response.json();
        

        console.log(
            "Simulation changed:",
            data
        );


        document.getElementById(
            "simulationStatus"
        ).textContent =
            "Simulation: " + mode;


        // Immediately update dashboard
        getHealthData();


    } catch (error) {

        console.error(
            "Failed to change simulation:",
            error
        );

    }
}




function initializeCharts() {

 const commonOptions = {

    responsive: true,

    animation: false,

    maintainAspectRatio: false,

    scales: {

        x: {

            ticks: {
                color: "#536b80",

                font: {
                    size: 9
                }
            },

            grid: {
                color: "#13283b"
            }
        },

        y: {

            ticks: {
                color: "#536b80",

                font: {
                    size: 9
                }
            },

            grid: {
                color: "#13283b"
            }
        }

    },

    plugins: {

        legend: {
            display: false
        }

    }
};


    // Heart Rate Chart

    heartRateChart = new Chart(
        document.getElementById("heartRateChart"),
        {
            type: "line",

            data: {
                labels: chartLabels,

                datasets: [
                    {
                        label: "Heart Rate",

                        data: heartRateData,

                        borderWidth: 2,

                        tension: 0.3,

                        pointRadius: 2
                    }
                ]
            },

            options: commonOptions
        }
    );


    // SpO2 Chart

    spo2Chart = new Chart(
        document.getElementById("spo2Chart"),
        {
            type: "line",

            data: {
                labels: chartLabels,

                datasets: [
                    {
                        label: "SpO₂",

                        data: spo2Data,

                        borderWidth: 2,

                        tension: 0.3,

                        pointRadius: 2
                    }
                ]
            },

            options: commonOptions
        }
    );


    // Temperature Chart

    temperatureChart = new Chart(
        document.getElementById("temperatureChart"),
        {
            type: "line",

            data: {
                labels: chartLabels,

                datasets: [
                    {
                        label: "Temperature",

                        data: temperatureData,

                        borderWidth: 2,

                        tension: 0.3,

                        pointRadius: 2
                    }
                ]
            },

            options: commonOptions
        }
    );
}

function updateCharts(data) {

    const time = data.timestamp;

    chartLabels.push(time);

    heartRateData.push(data.heart_rate);

    spo2Data.push(data.spo2);

    temperatureData.push(data.temperature);


    // Keep only the latest 20 readings

    if (chartLabels.length > 20) {

        chartLabels.shift();

        heartRateData.shift();

        spo2Data.shift();

        temperatureData.shift();
    }


    heartRateChart.update();

    spo2Chart.update();

    temperatureChart.update();
}

// ==========================================
// LOAD ALERT HISTORY
// ==========================================

async function loadAlertHistory() {

    try {

        const response =
            await fetch("/api/alerts");

        const alerts =
            await response.json();


        const history =
            document.getElementById(
                "alertHistory"
            );


        // No alerts
        if (alerts.length === 0) {

            history.innerHTML = `
                <tr>
                    <td colspan="4">
                        No mission alerts recorded.
                    </td>
                </tr>
            `;

            return;
        }


        history.innerHTML = "";


        alerts.forEach(alert => {

            let statusClass = "";
            let statusText = "";


            if (alert.status === "CRITICAL") {

                statusClass =
                    "status-critical";

                statusText =
                    "🔴 CRITICAL";

            }

            else if (alert.status === "WARNING") {

                statusClass =
                    "status-warning";

                statusText =
                    "🟡 WARNING";

            }

            else if (alert.status === "NORMAL") {

                statusClass =
                    "status-normal";

                statusText =
                    "🟢 NORMAL";

            }

            else {

                statusText =
                    alert.status;
            }


            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${alert.timestamp}
                </td>

                <td>
                    👩‍🚀 ${alert.astronaut}
                </td>

                <td class="${statusClass}">
                    ${statusText}
                </td>

                <td>
                    ${alert.message}
                </td>

            `;


            history.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Failed to load alert history:",
            error
        );

    }
}

async function loadActiveAlerts() {

    try {

        const response = await fetch("/api/active-alerts");

        const data = await response.json();


        // ==========================================
        // UPDATE TOP ACTIVE ALERTS COUNTER
        // ==========================================

        const topCountElement =
            document.getElementById("activeAlerts");

        if (topCountElement) {
            topCountElement.textContent =
                data.active_alerts;
        }


        // ==========================================
        // UPDATE BOTTOM ACTIVE ALERTS COUNTER
        // ==========================================

        const countElement =
            document.getElementById("activeAlertCount");

        const listElement =
            document.getElementById("activeAlertsList");

        if (countElement) {
            countElement.textContent =
                data.active_alerts;
        }


        // ==========================================
        // NO ACTIVE ALERTS
        // ==========================================

        if (data.active_alerts === 0) {

            listElement.innerHTML = `
                <div class="no-active-alerts">
                    🟢 No active alerts
                </div>
            `;

            return;
        }


        // ==========================================
        // DISPLAY ACTIVE ALERTS
        // ==========================================

        listElement.innerHTML = "";


        data.alerts.forEach(alert => {

            let statusIcon = "🟡";

            if (alert.status === "CRITICAL") {
                statusIcon = "🔴";
            }


            const alertItem =
                document.createElement("div");

            alertItem.className =
                "active-alert-item";


            alertItem.innerHTML = `

                <div class="active-alert-info">

                    <div class="active-alert-status">
                        ${statusIcon} ${alert.status}
                    </div>

                    <div class="active-alert-message">
                        ${alert.message}
                    </div>

                    <div class="active-alert-time">
                        👩‍🚀 ${alert.astronaut}
                        • ${alert.timestamp}
                    </div>

                </div>

                <button
                    class="acknowledge-button"
                    onclick="acknowledgeAlert(${alert.id})"
                >
                    ✓ ACKNOWLEDGE
                </button>

            `;


            listElement.appendChild(alertItem);

        });


    } catch (error) {

        console.error(
            "Failed to load active alerts:",
            error
        );

    }
}

async function acknowledgeAlert(alertId) {

    try {

        const response = await fetch(
            `/api/alerts/${alertId}/acknowledge`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (data.success) {

            console.log(
                "Alert acknowledged:",
                alertId
            );

            await loadActiveAlerts();

            await loadAlertHistory();

        } else {

            console.error(
                "Failed to acknowledge alert:",
                data.message
            );
        }

    } catch (error) {

        console.error(
            "Acknowledge request failed:",
            error
        );
    }
}
// ==========================================
// MISSION CONTROL ALERT BANNER
// ==========================================

function showMissionAlert(status, message, timestamp) {

    const banner =
        document.getElementById("missionAlertBanner");

    const icon =
        document.getElementById("missionAlertIcon");

    const title =
        document.getElementById("missionAlertTitle");

    const messageElement =
        document.getElementById("missionAlertMessage");

    const timeElement =
        document.getElementById("missionAlertTime");


    if (!banner) {
        return;
    }


    // Remove previous status classes
    banner.classList.remove(
        "warning",
        "critical"
    );


    // WARNING
    if (status === "WARNING") {

        banner.classList.add("warning");

        icon.textContent = "⚠️";

        title.textContent =
            "MISSION CONTROL WARNING";

    }


    // CRITICAL
    else if (status === "CRITICAL") {

        banner.classList.add("critical");

        icon.textContent = "🚨";

        title.textContent =
            "MISSION CONTROL CRITICAL ALERT";

    }


    else {

        return;

    }


    messageElement.textContent =
        "👩‍🚀 MAYA — " + message;

    timeElement.textContent =
        "Event time: " + timestamp;


    banner.style.display = "flex";
}


function closeMissionAlert() {

    const banner =
        document.getElementById(
            "missionAlertBanner"
        );

    if (banner) {

        banner.style.display = "none";

    }

}
// ==========================================
// START MONITORING
// ==========================================

initializeCharts();
getHealthData();
loadAlertHistory();
loadActiveAlerts();

setInterval(getHealthData, 3000);
setInterval(loadAlertHistory, 3000);
setInterval(loadActiveAlerts, 3000);


