from flask import Flask, render_template, jsonify, request
import random
from datetime import datetime

from database import (
    initialize_database,
    save_alert,
    get_alerts,
    get_active_alerts,
    acknowledge_alert
)

app = Flask(__name__)

# Current simulation mode
simulation_mode = "NORMAL"


# ==========================================
# HEALTH ANALYSIS
# ==========================================

def analyze_health(heart_rate, spo2, temperature):

    warnings = []
    critical = []

    # Heart Rate
    if heart_rate > 120:
        critical.append(
            "Heart rate critically elevated"
        )

    elif heart_rate > 100:
        warnings.append(
            "Heart rate elevated"
        )


    # SpO2
    if spo2 < 90:
        critical.append(
            "Oxygen saturation critically low"
        )

    elif spo2 < 95:
        warnings.append(
            "Oxygen saturation low"
        )


    # Temperature
    if temperature > 38.5:
        critical.append(
            "Temperature critically high"
        )

    elif temperature > 37.5:
        warnings.append(
            "Temperature elevated"
        )


    # Overall status
    if critical:

        status = "CRITICAL"

    elif warnings:

        status = "WARNING"

    else:

        status = "NORMAL"


    return status, warnings, critical


# ==========================================
# GENERATE HEALTH DATA
# ==========================================

def generate_health_data():

    global simulation_mode


    # NORMAL
    if simulation_mode == "NORMAL":

        heart_rate = random.randint(70, 85)

        spo2 = random.randint(96, 99)

        temperature = round(
            random.uniform(36.4, 37.1),
            1
        )


    # WARNING
    elif simulation_mode == "WARNING":

        heart_rate = random.randint(101, 115)

        spo2 = random.randint(91, 94)

        temperature = round(
            random.uniform(37.6, 38.2),
            1
        )


    # CRITICAL
    elif simulation_mode == "CRITICAL":

        heart_rate = random.randint(130, 145)

        spo2 = random.randint(85, 89)

        temperature = round(
            random.uniform(38.6, 39.2),
            1
        )


    else:

        heart_rate = 78

        spo2 = 98

        temperature = 36.7


    # Simulated blood pressure
    systolic = random.randint(110, 125)

    diastolic = random.randint(70, 80)


    # Analyze health
    status, warnings, critical = analyze_health(
        heart_rate,
        spo2,
        temperature
    )


    return {

        "astronaut": "Maya",

        "id": "AUR-001",

        "heart_rate": heart_rate,

        "spo2": spo2,

        "temperature": temperature,

        "blood_pressure":
            f"{systolic}/{diastolic}",

        "status": status,

        "warnings": warnings,

        "critical": critical,

        "simulation":
            simulation_mode,

        "timestamp":
            datetime.now().strftime("%H:%M:%S")
    }


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/")
def dashboard():

    return render_template(
        "dashboard.html"
    )


# ==========================================
# HEALTH API
# ==========================================

@app.route("/api/health")
def health_data():

    return jsonify(
        generate_health_data()
    )


# ==========================================
# CHANGE SIMULATION
# ==========================================

@app.route(
    "/api/simulation",
    methods=["POST"]
)
def change_simulation():

    global simulation_mode

    data = request.get_json()

    mode = data.get(
        "mode",
        "NORMAL"
    )


    if mode not in [
        "NORMAL",
        "WARNING",
        "CRITICAL"
    ]:

        return jsonify({
            "error":
                "Invalid simulation mode"
        }), 400


    simulation_mode = mode


    return jsonify({

        "success": True,

        "mode":
            simulation_mode

    })


# ==========================================
# SAVE ALERT
# ==========================================

@app.route(
    "/api/alerts",
    methods=["POST"]
)
def create_alert():

    data = request.get_json()


    astronaut = data.get(
        "astronaut",
        "Maya"
    )

    status = data.get(
        "status",
        "UNKNOWN"
    )

    message = data.get(
        "message",
        "Health status changed"
    )

    timestamp = data.get(
        "timestamp",
        datetime.now().strftime("%H:%M:%S")
    )


    save_alert(
        astronaut,
        status,
        message,
        timestamp
    )


    return jsonify({

        "success": True,

        "message":
            "Alert saved successfully"

    })


# ==========================================
# GET ALERT HISTORY
# ==========================================

@app.route("/api/alerts")
def alert_history():

    alerts = get_alerts()


    alert_list = []

    for alert in alerts:

        alert_list.append({

            "id":
                alert["id"],

            "astronaut":
                alert["astronaut"],

            "status":
                alert["status"],

            "message":
                alert["message"],

            "timestamp":
                alert["timestamp"]

        })


    return jsonify(alert_list)

# ==========================================
# ACTIVE ALERT COUNT
# ==========================================

@app.route("/api/active-alerts")
def active_alerts():
    alerts = get_active_alerts()

    alert_list = []

    for alert in alerts:
        alert_list.append({
            "id": alert["id"],
            "astronaut": alert["astronaut"],
            "status": alert["status"],
            "message": alert["message"],
            "timestamp": alert["timestamp"],
            "acknowledged": alert["acknowledged"]
        })

    return jsonify({
        "active_alerts": len(alert_list),
        "alerts": alert_list
    })

@app.route("/api/alerts/<int:alert_id>/acknowledge", methods=["POST"])
def acknowledge_alert_route(alert_id):

    updated = acknowledge_alert(alert_id)

    if updated == 0:
        return jsonify({
            "success": False,
            "message": "Alert not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Alert acknowledged successfully"
    })

# ==========================================
# START APPLICATION
# ==========================================

initialize_database()


if __name__ == "__main__":

    app.run(debug=True)