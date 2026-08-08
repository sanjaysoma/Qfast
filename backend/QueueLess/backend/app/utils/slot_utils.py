from datetime import datetime, timedelta

DEFAULT_SLOT_INTERVAL_MINUTES = 30


def resolve_slot_duration(schedule_duration=None, doctor_duration=None):
    return DEFAULT_SLOT_INTERVAL_MINUTES


def build_slot_times(start_time, end_time, slot_duration=None):
    duration = DEFAULT_SLOT_INTERVAL_MINUTES
    slots = []
    current_time = start_time

    while current_time < end_time:
        slots.append(current_time.strftime("%H:%M"))
        current_time += timedelta(minutes=duration)

    return slots
