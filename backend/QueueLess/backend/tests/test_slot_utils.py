from datetime import datetime, time, timedelta

from app.utils.slot_utils import DEFAULT_SLOT_INTERVAL_MINUTES, build_slot_times, resolve_slot_duration


def test_build_slot_times_uses_thirty_minute_interval():
    start_time = datetime.combine(datetime.today(), time(hour=9, minute=0))
    end_time = datetime.combine(datetime.today(), time(hour=10, minute=0))

    slots = build_slot_times(start_time, end_time)

    assert slots == ["09:00", "09:30"]


def test_resolve_slot_duration_defaults_to_thirty_minutes():
    assert resolve_slot_duration(None, None) == DEFAULT_SLOT_INTERVAL_MINUTES
    assert resolve_slot_duration(15, None) == DEFAULT_SLOT_INTERVAL_MINUTES
    assert resolve_slot_duration(None, 15) == DEFAULT_SLOT_INTERVAL_MINUTES
