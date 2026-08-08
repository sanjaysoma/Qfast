import re


def extract_coordinates_from_google_maps(google_maps_link: str) -> dict | None:
    """Extract coordinates from a Google Maps URL or query string."""

    if not google_maps_link:
        return None

    link = google_maps_link.strip()

    patterns = [
        r"[?&](?:q|query)=\s*([+-]?\d+(?:\.\d+)?),\s*([+-]?\d+(?:\.\d+)?)",
        r"/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)(?:[,/]|$)",
        r"!3d([+-]?\d+(?:\.\d+)?)!4d([+-]?\d+(?:\.\d+)?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, link)
        if match:
            try:
                return {
                    "latitude": float(match.group(1)),
                    "longitude": float(match.group(2)),
                }
            except ValueError:
                return None

    return None
