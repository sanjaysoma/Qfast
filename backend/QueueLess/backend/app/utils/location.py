import math


def calculate_distance(user_lat, user_lon, hospital_lat, hospital_lon):
    """Calculate distance between two geographic coordinates using the Haversine formula."""

    radius_km = 6371.0

    lat1 = math.radians(user_lat)
    lon1 = math.radians(user_lon)
    lat2 = math.radians(hospital_lat)
    lon2 = math.radians(hospital_lon)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return radius_km * c
