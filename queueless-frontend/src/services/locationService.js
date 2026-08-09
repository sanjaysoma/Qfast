const getFallbackLocation = () => ({
  latitude: null,
  longitude: null,
  accuracy: null,
  city: null,
  source: "none",
});

const getIpBasedLocation = async () => {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`IP lookup failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data?.latitude == null || data?.longitude == null) {
      return getFallbackLocation();
    }

    return {
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: null,
      city: data.city || data.region || data.country_name || null,
      source: "ip",
    };
  } catch (error) {
    console.warn("IP-based location fallback failed:", error);
    return getFallbackLocation();
  }
};

const getInjectedLocation = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = window.__VDocQ_MOBILE_LOCATION__ || window.__QFast_MOBILE_LOCATION__ || window.__Medvo_MOBILE_LOCATION__;
  if (!candidate) {
    return null;
  }

  const latitude = Number(candidate.latitude);
  const longitude = Number(candidate.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: candidate.accuracy != null ? Number(candidate.accuracy) : null,
    city: null,
    source: candidate.source || "native",
  };
};

const waitForInjectedLocation = (timeoutMs = 4000) => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const existing = getInjectedLocation();
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timerId);
      window.removeEventListener("VDocQ-native-location", onNativeLocation);
      window.removeEventListener("QFast-native-location", onNativeLocation);
      window.removeEventListener("Medvo-native-location", onNativeLocation);
      resolve(value);
    };

    const onNativeLocation = () => {
      finish(getInjectedLocation());
    };

    const timerId = window.setTimeout(() => finish(null), timeoutMs);
    window.addEventListener("VDocQ-native-location", onNativeLocation, { once: true });
    window.addEventListener("QFast-native-location", onNativeLocation, { once: true });
    window.addEventListener("Medvo-native-location", onNativeLocation, { once: true });
  });
};

export const getCurrentLocation = async (opts = {}) => {
  const minAccuracy = opts.minAccuracy || 1000; // meters
  const watchTimeout = opts.watchTimeout || 15000; // ms
  const enableHighAccuracy = opts.enableHighAccuracy ?? true;
  const maximumAge = opts.maximumAge ?? 30000;
  const allowIpFallback = opts.allowIpFallback === true;
  const preferInjectedMobile = opts.preferInjectedMobile !== false;
  const isMobileWebView =
    typeof window !== "undefined" &&
    (typeof window.ReactNativeWebView !== "undefined" || typeof window.__VDocQ_LOCATION_ENABLED__ !== "undefined" || typeof window.__QFast_LOCATION_ENABLED__ !== "undefined");

  let injectedLocation = getInjectedLocation();

  if (!injectedLocation && preferInjectedMobile && isMobileWebView) {
    injectedLocation = await waitForInjectedLocation(opts.injectedWaitTimeout || 4000);
  }

  if (injectedLocation) {
    return injectedLocation;
  }

  if (navigator.geolocation) {
    try {
      const firstPos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            try {
              console.info(
                "getCurrentLocation: navigator returned coords " +
                  JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                  })
              );
            } catch {
              console.info("getCurrentLocation: navigator returned coords", position.coords);
            }
            resolve(position);
          },
          (error) => {
            console.warn("getCurrentLocation: geolocation error", error?.code, error?.message);
            reject(error);
          },
          {
            enableHighAccuracy,
            timeout: 15000,
            maximumAge,
          }
        );
      });

      const firstAcc = firstPos.coords && firstPos.coords.accuracy != null ? firstPos.coords.accuracy : Infinity;
      if (Number.isFinite(firstAcc) && firstAcc <= minAccuracy) {
        return {
          latitude: firstPos.coords.latitude,
          longitude: firstPos.coords.longitude,
          accuracy: firstAcc,
          city: null,
          source: "gps",
        };
      }

      let lastPos = firstPos;
      const watchedPos = await new Promise((resolve) => {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            lastPos = position;
            const acc = position.coords && position.coords.accuracy != null ? position.coords.accuracy : Infinity;
            if (Number.isFinite(acc) && acc <= minAccuracy) {
              clearTimeout(timeoutId);
              navigator.geolocation.clearWatch(id);
              resolve(position);
            }
          },
          () => {
            clearTimeout(timeoutId);
            navigator.geolocation.clearWatch(id);
            resolve(lastPos);
          },
          {
            enableHighAccuracy,
            maximumAge,
          }
        );

        const timeoutId = setTimeout(() => {
          try {
            navigator.geolocation.clearWatch(id);
          } catch {
            // no-op: watcher may already be cleared
          }
          resolve(lastPos);
        }, watchTimeout);
      });

      const finalPos = watchedPos || lastPos;
      const finalAcc = finalPos.coords && finalPos.coords.accuracy != null ? finalPos.coords.accuracy : null;
      if (Number.isFinite(finalAcc) && finalAcc <= minAccuracy) {
        return {
          latitude: finalPos.coords.latitude,
          longitude: finalPos.coords.longitude,
          accuracy: finalAcc,
          city: null,
          source: "gps",
        };
      }

      // Return the best available GPS fix even if accuracy is lower than
      // preferred threshold, so nearby search can still work with coordinates.
      if (
        finalPos?.coords &&
        Number.isFinite(finalPos.coords.latitude) &&
        Number.isFinite(finalPos.coords.longitude)
      ) {
        return {
          latitude: finalPos.coords.latitude,
          longitude: finalPos.coords.longitude,
          accuracy: finalAcc,
          city: null,
          source: "gps_low_accuracy",
        };
      }
    } catch (err) {
      console.warn("Geolocation failed, falling back to IP-based location:", err);
    }
  } else {
    console.warn("Navigator geolocation not available, using IP fallback.");
  }

  if (allowIpFallback) {
    return getIpBasedLocation();
  }

  return getFallbackLocation();
};

export const getCityFromCoordinates = async (latitude, longitude, options = {}) => {
  const preferArea = options.preferArea !== false;
  if (latitude == null || longitude == null) {
    return null;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Reverse geocoding failed, skipping city lookup:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    try {
      console.info(
        "getCityFromCoordinates: reverse geocode response " +
          JSON.stringify({ latitude, longitude, data })
      );
    } catch {
      console.info("getCityFromCoordinates: reverse geocode response", { latitude, longitude, data });
    }

    const address = data.address || {};

    const areaFirstCandidates = [
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.residential,
      address.locality,
      address.quarter,
      address.hamlet,
      address.village,
      address.town,
      address.city,
      address.county,
      address.state_district,
      address.state,
    ].filter(Boolean);

    const cityFirstCandidates = [
      address.city,
      address.town,
      address.village,
      address.county,
      address.state_district,
      address.state,
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.locality,
    ].filter(Boolean);

    const candidates = preferArea ? areaFirstCandidates : cityFirstCandidates;

    for (const candidate of candidates) {
      if (typeof candidate !== "string") continue;
      const cleaned = candidate.replace(/\s+/g, " ").trim();
      if (cleaned) {
        return cleaned;
      }
    }

    if (typeof data.display_name === "string" && data.display_name.trim()) {
      return data.display_name.split(",")[0].trim() || null;
    }

    return null;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
};


