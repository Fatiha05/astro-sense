import sqlite3

DATABASE = "astro_health.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            astronaut TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0
        )
    """)

    # Add acknowledged column if the old database already exists
    cursor.execute("PRAGMA table_info(alerts)")
    columns = [column["name"] for column in cursor.fetchall()]

    if "acknowledged" not in columns:
        cursor.execute("""
            ALTER TABLE alerts
            ADD COLUMN acknowledged INTEGER DEFAULT 0
        """)

    connection.commit()
    connection.close()


def save_alert(astronaut, status, message, timestamp):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO alerts
        (astronaut, status, message, timestamp, acknowledged)
        VALUES (?, ?, ?, ?, ?)
    """, (
        astronaut,
        status,
        message,
        timestamp,
        0
    ))

    connection.commit()
    connection.close()


def get_alerts():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        ORDER BY id DESC
    """)

    alerts = cursor.fetchall()
    connection.close()

    return alerts


def get_active_alerts():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM alerts
        WHERE status IN ('WARNING', 'CRITICAL')
        AND acknowledged = 0
        ORDER BY id DESC
    """)

    alerts = cursor.fetchall()
    connection.close()

    return alerts


def acknowledge_alert(alert_id):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE alerts
        SET acknowledged = 1
        WHERE id = ?
    """, (alert_id,))

    connection.commit()

    updated = cursor.rowcount

    connection.close()

    return updated