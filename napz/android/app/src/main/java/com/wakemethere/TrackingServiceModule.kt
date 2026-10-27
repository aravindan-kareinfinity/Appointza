package com.wakemethere

import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import android.util.Log
import com.facebook.react.modules.core.DeviceEventManagerModule

class TrackingServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "LOCATION_AUDIT"
    }

    override fun getName(): String = "TrackingServiceModule"

    private fun logAccessAttempt(method: String) {
        Log.i(
            TAG,
            "LOCATION_ACCESS_ATTEMPT source=TrackingServiceModule.$method " +
                "fgDisclosure=${TrackingSession.hasForegroundDisclosure(reactContext)} " +
                "bgDisclosure=${TrackingSession.hasBackgroundDisclosure(reactContext)} " +
                "fgPermission=${TrackingSession.hasFineLocationPermission(reactContext)} " +
                "bgPermission=${TrackingSession.hasBackgroundLocationPermission(reactContext)}"
        )
    }

    private fun isValidCoordinate(lat: Double, lng: Double): Boolean {
        return lat.isFinite() && lng.isFinite() &&
            lat in -90.0..90.0 && lng in -180.0..180.0
    }

    private fun sanitizeRadius(value: Double): Double {
        if (!value.isFinite() || value <= 0.0) return 1000.0
        return value.coerceAtLeast(25.0)
    }

    private var watchListener: LocationListener? = null

    @ReactMethod
    fun addListener(eventName: String) {
        /* RN event emitter */
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        /* RN event emitter */
    }

    @ReactMethod
    fun isDeviceLocationEnabled(promise: Promise) {
        try {
            val lm = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val enabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                lm.isLocationEnabled
            } else {
                @Suppress("DEPRECATION")
                lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                    lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            }
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.reject("LOCATION_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openDeviceLocationSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            try {
                val fallback = Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(fallback)
                promise.resolve(true)
            } catch (inner: Exception) {
                promise.reject("SETTINGS_ERROR", inner.message, inner)
            }
        }
    }

    @ReactMethod
    fun getCurrentPosition(timeoutMs: Double, promise: Promise) {
        logAccessAttempt("getCurrentPosition")
        if (!TrackingSession.canAccessForegroundLocation(reactContext)) {
            promise.reject(
                "LOCATION_DISCLOSURE_REQUIRED",
                "Foreground location disclosure must be accepted before accessing location"
            )
            return
        }
        DeviceLocation.requestSingle(reactContext, timeoutMs.toLong(), promise)
    }

    @ReactMethod
    fun startPositionWatch(promise: Promise) {
        logAccessAttempt("startPositionWatch")
        if (!TrackingSession.canAccessForegroundLocation(reactContext)) {
            promise.reject(
                "LOCATION_DISCLOSURE_REQUIRED",
                "Foreground location disclosure must be accepted before accessing location"
            )
            return
        }
        stopPositionWatchInternal()
        val lm = reactContext.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
        val listener = LocationListener { location: Location ->
            emitLocation(location)
        }
        watchListener = listener
        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 4_000L, 8f, listener, Looper.getMainLooper())
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 4_000L, 8f, listener, Looper.getMainLooper())
            }
            DeviceLocation.lastKnown(reactContext)?.let { emitLocation(it) }
            promise.resolve(true)
        } catch (_: SecurityException) {
            promise.reject("permission", "ACCESS_FINE_LOCATION required")
        } catch (e: Exception) {
            promise.reject("unavailable", e.message, e)
        }
    }

    @ReactMethod
    fun stopPositionWatch(promise: Promise) {
        stopPositionWatchInternal()
        promise.resolve(true)
    }

    private fun stopPositionWatchInternal() {
        val listener = watchListener ?: return
        watchListener = null
        try {
            val lm = reactContext.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
            lm.removeUpdates(listener)
        } catch (_: Throwable) {
        }
    }

    private fun emitLocation(location: Location) {
        val map = DeviceLocation.toMap(location)
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("NapzLocation", map)
    }

    @ReactMethod
    fun setLocationDisclosureConsent(foregroundAccepted: Boolean, backgroundAccepted: Boolean, promise: Promise) {
        try {
            TrackingSession.setDisclosureAccepted(reactContext, foregroundAccepted, backgroundAccepted)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONSENT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startTrackingService(config: ReadableMap, promise: Promise) {
        try {
            if (!TrackingSession.canAccessBackgroundLocation(reactContext)) {
                promise.reject(
                    "LOCATION_DISCLOSURE_REQUIRED",
                    "Foreground and background location disclosure plus permissions are required before tracking"
                )
                return
            }

            if (!config.hasKey("destinationLat") || !config.hasKey("destinationLng")) {
                promise.reject("TRACKING_CONFIG_ERROR", "Destination coordinates are required")
                return
            }

            val destinationLat = config.getDouble("destinationLat")
            val destinationLng = config.getDouble("destinationLng")
            if (!isValidCoordinate(destinationLat, destinationLng)) {
                promise.reject("TRACKING_CONFIG_ERROR", "Invalid destination coordinates")
                return
            }

            val radiusMeters = if (config.hasKey("radiusMeters")) {
                sanitizeRadius(config.getDouble("radiusMeters"))
            } else {
                1000.0
            }
            val destinationName = config.getString("destinationName")?.ifBlank { "Destination" } ?: "Destination"
            val soundUri = config.getString("soundUri")

            val intent = Intent(reactContext, TrackingForegroundService::class.java).apply {
                putExtra("destinationName", destinationName)
                putExtra("destinationLat", destinationLat)
                putExtra("destinationLng", destinationLng)
                putExtra("radiusMeters", radiusMeters)
                putExtra("soundUri", soundUri)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            TrackingSession.clearPendingRestart(reactContext)
            promise.resolve("Tracking service started")
        } catch (e: Exception) {
            promise.reject("TRACKING_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun stopTrackingService(promise: Promise) {
        try {
            val intent = Intent(reactContext, TrackingForegroundService::class.java)
            reactContext.stopService(intent)
            TrackingSession.clearActiveSessionKeepDisclosure(reactContext)
            promise.resolve("Tracking service stopped")
        } catch (e: Exception) {
            promise.reject("TRACKING_SERVICE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getPendingAlarmLaunch(promise: Promise) {
        try {
            val name = AlarmIntentHolder.takePendingDestinationName()
            if (name == null) {
                promise.resolve(null)
                return
            }
            val map: WritableMap = Arguments.createMap()
            map.putString("destinationName", name)
            map.putBoolean("triggeredByService", true)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("PENDING_ALARM_ERROR", e.message, e)
        }
    }
}
