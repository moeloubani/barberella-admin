#!/usr/bin/env python3
import psycopg2
import json
from datetime import datetime

# Database connection parameters
db_params = {
    'host': 'caboose.proxy.rlwy.net',
    'port': 13809,
    'database': 'barberella',
    'user': 'barberella',
    'password': 'barberella_password_2024'
}

def check_database():
    try:
        # Connect to the database
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()

        print("Successfully connected to the database!")
        print("=" * 60)

        # 1. Count appointments
        cur.execute("SELECT COUNT(*) FROM appointments")
        appointment_count = cur.fetchone()[0]
        print(f"\n1. Total appointments in table: {appointment_count}")
        print("-" * 40)

        # 2. Get sample appointments
        cur.execute("""
            SELECT id, start_time, end_time, status, service,
                   client_name, client_phone, barber_id, created_at
            FROM appointments
            ORDER BY created_at DESC
            LIMIT 5
        """)
        appointments = cur.fetchall()

        print("\n2. Sample appointments (most recent 5):")
        for apt in appointments:
            print(f"\n  ID: {apt[0]}")
            print(f"  Start: {apt[1]}")
            print(f"  End: {apt[2]}")
            print(f"  Status: {apt[3]}")
            print(f"  Service: {apt[4]}")
            print(f"  Client: {apt[5]}")
            print(f"  Phone: {apt[6]}")
            print(f"  Barber ID: {apt[7]}")
            print(f"  Created: {apt[8]}")
        print("-" * 40)

        # 3. Count barbers
        cur.execute("SELECT COUNT(*) FROM barbers")
        barber_count = cur.fetchone()[0]
        print(f"\n3. Total barbers in table: {barber_count}")

        # Get barber details - first check what columns exist
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'barbers'
            ORDER BY ordinal_position
        """)
        barber_columns = [col[0] for col in cur.fetchall()]
        print(f"   Barber table columns: {', '.join(barber_columns)}")

        # Get barber details
        cur.execute("SELECT * FROM barbers")
        barbers = cur.fetchall()
        for barber in barbers:
            print(f"   - Barber data: {barber}")
        print("-" * 40)

        # 4. Check for completed appointments
        cur.execute("SELECT COUNT(*) FROM appointments WHERE status = 'completed'")
        completed_count = cur.fetchone()[0]
        print(f"\n4. Appointments with status 'completed': {completed_count}")

        # Check all status values
        cur.execute("""
            SELECT status, COUNT(*)
            FROM appointments
            GROUP BY status
            ORDER BY COUNT(*) DESC
        """)
        status_counts = cur.fetchall()
        print("\n   All status values:")
        for status, count in status_counts:
            print(f"   - {status}: {count}")
        print("-" * 40)

        # 5. Check date ranges
        cur.execute("""
            SELECT
                MIN(start_time) as earliest,
                MAX(start_time) as latest,
                COUNT(CASE WHEN start_time >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
                COUNT(CASE WHEN start_time >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
                COUNT(CASE WHEN DATE(start_time) = CURRENT_DATE THEN 1 END) as today
            FROM appointments
        """)
        date_info = cur.fetchone()

        print(f"\n5. Date range analysis:")
        print(f"   Earliest appointment: {date_info[0]}")
        print(f"   Latest appointment: {date_info[1]}")
        print(f"   Appointments in last 7 days: {date_info[2]}")
        print(f"   Appointments in last 30 days: {date_info[3]}")
        print(f"   Appointments today: {date_info[4]}")
        print("-" * 40)

        # Additional: Check table schema
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'appointments'
            ORDER BY ordinal_position
        """)
        columns = cur.fetchall()
        print("\n6. Appointments table schema:")
        for col in columns:
            print(f"   - {col[0]}: {col[1]} (nullable: {col[2]})")

        # Close connection
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_database()