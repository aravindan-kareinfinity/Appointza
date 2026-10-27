package com.wakemethere

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Promise

/**
 * GPS via Android LocationManager only — never Google Play Services Fused /
 * checkLocationSettings (that UI is the "Location Accuracy" dialog).
 *
 * Callers must already pass TrackingSession disclosure + permission gates.
 * These methods refuse to touch LocationManager if the gate fails.
 */
object DeviceLocation {
    private const val TAG = "LOCATION_AUDIT"
    private val mainHandler = Handler(Looper.getMainLooper())

    private fun logAccessAttempt(method: String, context: Context) {
        Log.i(
            TAG,
            "LOCATION_ACCESS_ATTEMPT source=DeviceLocation.$method " +
                "fgDisclosure=${TrackingSession.hasForegroundDisclosure(context)} " +
                "bgDisclosure=${TrackingSession.hasBackgroundDisclosure(context)} " +
                "fgPermission=${TrackingSession.hasFineLocationPermission(context)} " +
                "bgPermission=${TrackingSession.hasBackgroundLocationPermission(context)}"
        )
    }

    @SuppressLint("MissingPermission")
    fun lastKnown(context: Context): Location? {
        logAccessAttempt("lastKnown", context)
        if (!TrackingSession.canAccessForegroundLocation(context) &&
            !TrackingSession.canAccessBackgroundLocation(context)
        ) {
            Log.w(TAG, "BLOCKED lastKnown — disclosure or permission missing")
            return null
        }
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val gps = try { lm.getLastKnownLocation(LocationManager.GPS_PROVIDER) } catch (_: SecurityException) { null }
        val network = try { lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) } catch (_: SecurityException) { null }
        return when {
            gps == null -> network
            network == null -> gps
            gps.time >= network.time -> gps
            else -> network
        }
    }

    @SuppressLint("MissingPermission")
    fun requestSingle(context: Context, timeoutMs: Long, promise: Promise) {
        logAccessAttempt("requestSingle", context)
        if (!TrackingSession.canAccessForegroundLocation(context)) {
            promise.reject(
                "LOCATION_DISCLOSURE_REQUIRED",
                "Foreground location disclosure must be accepted before accessing location"
            )
            return
        }
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val cached = lastKnown(context)
        if (cached != null && System.currentTimeMillis() - cached.time < 30_000L) {
            promise.resolve(toMap(cached))
            return
        }

        var settled = false
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (settled) return
                settled = true
                mainHandler.removeCallbacksAndMessages(null)
                try { lm.removeUpdates(this) } catch (_: Throwable) {}
                promise.resolve(toMap(location))
            }
        }

        val timeout = Runnable {
            if (settled) return@Runnable
            settled = true
            try { lm.removeUpdates(listener) } catch (_: Throwable) {}
            val fallback = lastKnown(context)
            if (fallback != null) {
                promise.resolve(toMap(fallback))
            } else {
                promise.reject("position_unavailable", "Location unavailable")
            }
        }

        try {
            val gpsOn = lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val netOn = lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            if (!gpsOn && !netOn) {
                promise.reject("position_unavailable", "Location providers disabled")
                return
            }
            if (gpsOn) {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, listener, Looper.getMainLooper())
            }
            if (netOn) {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, listener, Looper.getMainLooper())
            }
            mainHandler.postDelayed(timeout, timeoutMs.coerceAtLeast(3_000L))
        } catch (_: SecurityException) {
            promise.reject("permission", "Location permission missing")
        } catch (e: IllegalArgumentException) {
            promise.reject("unavailable", e.message)
        }
    }

    fun toMap(location: Location): com.facebook.react.bridge.WritableMap {
        val map = com.facebook.react.bridge.Arguments.createMap()
        map.putDouble("lat", location.latitude)
        map.putDouble("lng", location.longitude)
        return map
    }
}
