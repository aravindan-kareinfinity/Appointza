package com.wakemethere

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.content.pm.ServiceInfo
import android.util.Log
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import kotlin.math.sqrt

class TrackingForegroundService : Service() {

    /**
     * Never resolve Android's location service during Service.onCreate().
     * It is initialized only after disclosure and foreground/background
     * permissions pass in onStartCommand().
     */
    private var locationManager: LocationManager? = null
    private lateinit var audioManager: AudioManager
    private var locationListener: LocationListener? = null
    private var mediaPlayer: MediaPlayer? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var alarmWakeLock: PowerManager.WakeLock? = null

    private var destinationName: String = "Destination"
    private var destinationLat: Double = 0.0
    private var destinationLng: Double = 0.0
    private var radiusMeters: Double = 1000.0
    private var soundUri: String = ""
    private var alarmTriggered = false

    private val prefs by lazy { TrackingSession.sharedPrefs(this) }

    private data class TrackingPolicy(
        val band: Int,
        val intervalMs: Long,
        val minIntervalMs: Long,
        val minDistanceM: Float,
    )

    private var currentPolicy: TrackingPolicy? = null

    companion object {
        private const val TAG = "LOCATION_AUDIT"
        const val EXTRA_ALARM_TRIGGERED = "ALARM_TRIGGERED"
        const val EXTRA_DESTINATION_NAME = "DESTINATION_NAME"
        private const val TRACKING_CHANNEL_ID = "tracking_service_channel"
        private const val ALARM_CHANNEL_ID = "alarm_channel"
        private const val TRACKING_NOTIFICATION_ID = 1001
        private const val ALARM_NOTIFICATION_ID = 1002
        private const val MIN_RADIUS_METERS = 25.0
    }

    override fun onCreate() {
        super.onCreate()
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(
            TAG,
            "LOCATION_AUDIT TrackingForegroundService.onStartCommand " +
                "fgDisclosure=${TrackingSession.hasForegroundDisclosure(this)} " +
                "bgDisclosure=${TrackingSession.hasBackgroundDisclosure(this)}"
        )
        val hasIntentData = intent != null && intent.hasExtra("destinationLat") && intent.hasExtra("destinationLng")
        if (hasIntentData) {
            destinationName = intent?.getStringExtra("destinationName") ?: "Destination"
            destinationLat = intent?.getDoubleExtra("destinationLat", 0.0) ?: 0.0
            destinationLng = intent?.getDoubleExtra("destinationLng", 0.0) ?: 0.0
            radiusMeters = sanitizeRadius(intent?.getDoubleExtra("radiusMeters", 1000.0) ?: 1000.0)
            soundUri = intent?.getStringExtra("soundUri") ?: defaultSoundUri()

            // Persist the current session so we can recover if the app is swiped away
            // and the OS restarts the service without extras.
            prefs.edit()
                .putString(TrackingSession.PREF_DEST_NAME, destinationName)
                .putLong(TrackingSession.PREF_DEST_LAT, java.lang.Double.doubleToRawLongBits(destinationLat))
                .putLong(TrackingSession.PREF_DEST_LNG, java.lang.Double.doubleToRawLongBits(destinationLng))
                .putLong(TrackingSession.PREF_RADIUS, java.lang.Double.doubleToRawLongBits(radiusMeters))
                .putString(TrackingSession.PREF_SOUND_URI, soundUri)
                .apply()
        } else {
            // Recovery path: after process death, Android can restart the service with a null intent.
            val name = prefs.getString(TrackingSession.PREF_DEST_NAME, null)
            val latBits = prefs.getLong(TrackingSession.PREF_DEST_LAT, java.lang.Double.doubleToRawLongBits(0.0))
            val lngBits = prefs.getLong(TrackingSession.PREF_DEST_LNG, java.lang.Double.doubleToRawLongBits(0.0))
            val radiusBits = prefs.getLong(TrackingSession.PREF_RADIUS, java.lang.Double.doubleToRawLongBits(1000.0))
            val s = prefs.getString(TrackingSession.PREF_SOUND_URI, null)
            if (name.isNullOrBlank()) {
                Log.w(TAG, "Missing tracking intent data and no saved session; stopping service")
                stopSelf()
                return START_NOT_STICKY
            }
            destinationName = name
            destinationLat = java.lang.Double.longBitsToDouble(latBits)
            destinationLng = java.lang.Double.longBitsToDouble(lngBits)
            radiusMeters = sanitizeRadius(java.lang.Double.longBitsToDouble(radiusBits))
            soundUri = s ?: defaultSoundUri()
            Log.i(TAG, "Recovered tracking session from prefs: $destinationName")
        }

        if (!isValidCoordinate(destinationLat, destinationLng)) {
            Log.w(TAG, "Invalid destination coordinates; stopping service")
            stopSelf()
            return START_NOT_STICKY
        }

        alarmTriggered = false
        if (!TrackingSession.canAccessBackgroundLocation(this)) {
            Log.w(TAG, "Stopping FGS: disclosure or location permission missing")
            stopSelf()
            return START_NOT_STICKY
        }
        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        Log.i(TAG, "LOCATION_MANAGER_INITIALIZED after disclosure and permission gates")
        enterForegroundTracking()
        startLocationUpdates()
        checkImmediateProximity()
        return START_STICKY
    }

    // ── Location tracking ──────────────────────────────────────────────────────

    private fun policyForDistance(distMeters: Double): TrackingPolicy {
        // Distance-based schedule:
        // >100km → 5 min
        // 50–100km → 2 min
        // 10–50km → 1 min
        // 2–10km → 30 sec
        // 500m–2km → 10 sec
        // 100m–500m → 5 sec
        // <100m → 1–3 sec
        return when {
            distMeters > 100_000.0 -> TrackingPolicy(band = 6, intervalMs = 5 * 60_000L, minIntervalMs = 60_000L, minDistanceM = 500f)
            distMeters > 50_000.0 -> TrackingPolicy(band = 5, intervalMs = 2 * 60_000L, minIntervalMs = 30_000L, minDistanceM = 400f)
            distMeters > 10_000.0 -> TrackingPolicy(band = 4, intervalMs = 60_000L, minIntervalMs = 15_000L, minDistanceM = 250f)
            distMeters > 2_000.0 -> TrackingPolicy(band = 3, intervalMs = 30_000L, minIntervalMs = 10_000L, minDistanceM = 150f)
            distMeters > 500.0 -> TrackingPolicy(band = 2, intervalMs = 10_000L, minIntervalMs = 5_000L, minDistanceM = 75f)
            distMeters > 100.0 -> TrackingPolicy(band = 1, intervalMs = 5_000L, minIntervalMs = 3_000L, minDistanceM = 35f)
            else -> TrackingPolicy(band = 0, intervalMs = 2_000L, minIntervalMs = 1_000L, minDistanceM = 10f)
        }
    }

    private fun ensurePolicy(distMeters: Double) {
        val next = policyForDistance(distMeters)
        if (currentPolicy?.band == next.band) return
        currentPolicy = next
        restartLocationUpdates(next)
    }

    private fun restartLocationUpdates(policy: TrackingPolicy) {
        stopLocationUpdates()
        requestLocationUpdates(policy)
    }

    private fun startLocationUpdates() {
        stopLocationUpdates()
        locationListener = LocationListener { location: Location ->
            evaluateDistanceAndTrigger(location.latitude, location.longitude)
        }
        // Start conservative, then refine after the first fix.
        currentPolicy = TrackingPolicy(band = 4, intervalMs = 60_000L, minIntervalMs = 15_000L, minDistanceM = 250f)
        requestLocationUpdates(currentPolicy as TrackingPolicy)
    }

    /**
     * Use Android LocationManager only — never Fused / Play Services Settings resolution.
     * PRIORITY_HIGH_ACCURACY on Fused can show Google's "Location Accuracy" dialog over the map.
     */
    private fun requestLocationUpdates(policy: TrackingPolicy) {
        if (!TrackingSession.canAccessBackgroundLocation(this)) {
            Log.w(TAG, "Skipping location updates: disclosure or permission missing")
            stopSelf()
            return
        }
        val manager = locationManager ?: run {
            Log.w(TAG, "Skipping location updates: LocationManager is not initialized")
            stopSelf()
            return
        }
        val listener = locationListener ?: return
        try {
            val gpsOn = manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
            val networkOn = manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            if (gpsOn) {
                manager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    policy.intervalMs,
                    policy.minDistanceM,
                    listener,
                    Looper.getMainLooper()
                )
            }
            if (networkOn) {
                manager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    policy.intervalMs,
                    policy.minDistanceM,
                    listener,
                    Looper.getMainLooper()
                )
            }
            if (!gpsOn && !networkOn) {
                manager.requestLocationUpdates(
                    LocationManager.PASSIVE_PROVIDER,
                    policy.intervalMs,
                    policy.minDistanceM,
                    listener,
                    Looper.getMainLooper()
                )
            }
        } catch (_: SecurityException) {
            stopSelf()
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Location provider unavailable: ${e.message}")
        }
    }

    private fun stopLocationUpdates() {
        val manager = locationManager ?: return
        locationListener?.let {
            try {
                manager.removeUpdates(it)
            } catch (_: Throwable) {
            }
        }
    }

    /** If user already starts tracking inside radius, trigger immediately. */
    private fun checkImmediateProximity() {
        try {
            val last = lastKnownLocation() ?: return
            evaluateDistanceAndTrigger(last.latitude, last.longitude)
        } catch (_: SecurityException) {
        }
    }

    private fun lastKnownLocation(): Location? {
        if (!TrackingSession.canAccessBackgroundLocation(this)) return null
        val manager = locationManager ?: return null
        val gps = try {
            manager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        } catch (_: SecurityException) {
            null
        }
        val network = try {
            manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
        } catch (_: SecurityException) {
            null
        }
        return when {
            gps == null -> network
            network == null -> gps
            gps.time >= network.time -> gps
            else -> network
        }
    }

    private fun evaluateDistanceAndTrigger(currentLat: Double, currentLng: Double) {
        if (alarmTriggered) return
        val dist = haversineDistance(currentLat, currentLng, destinationLat, destinationLng)
        // Dynamically adjust update rate based on distance.
        ensurePolicy(dist)
        if (dist <= radiusMeters) {
            alarmTriggered = true
            stopLocationUpdates()
            triggerAlarm()
        }
    }

    private fun isValidCoordinate(lat: Double, lng: Double): Boolean {
        return lat.isFinite() && lng.isFinite() &&
                lat in -90.0..90.0 && lng in -180.0..180.0
    }

    private fun sanitizeRadius(value: Double): Double {
        if (!value.isFinite() || value <= 0.0) return 1000.0
        return max(value, MIN_RADIUS_METERS)
    }

    private fun defaultSoundUri(): String = "android.resource://$packageName/raw/classic"

    // ── Alarm ──────────────────────────────────────────────────────────────────

    private fun triggerAlarm() {
        acquireAlarmWakeLock()
        startAlarmSound()
        startVibration()
        showAlarmNotification()
    }

    private fun acquireAlarmWakeLock() {
        try {
            alarmWakeLock?.release()
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            @Suppress("DEPRECATION")
            val wl = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "napz:ArrivalAlarm"
            )
            wl.setReferenceCounted(false)
            wl.acquire(15 * 60 * 1000L)
            alarmWakeLock = wl
        } catch (e: Exception) {
            Log.w(TAG, "WakeLock: ${e.message}")
        }
    }

    private fun releaseAlarmWakeLock() {
        try {
            if (alarmWakeLock?.isHeld == true) {
                alarmWakeLock?.release()
            }
        } catch (_: Exception) {}
        alarmWakeLock = null
    }

    /** Open the app and navigate to AlarmScreen via Intent extras */
    private fun launchAlarmScreen() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_ALARM_TRIGGERED, true)
            putExtra(EXTRA_DESTINATION_NAME, destinationName)
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            Log.w(TAG, "Could not launch alarm activity directly: ${e.message}")
        }
    }

    private fun startAlarmSound() {
        try {
            requestAlarmAudioFocus()
            try {
                audioManager.mode = AudioManager.MODE_NORMAL
                audioManager.isSpeakerphoneOn = true
            } catch (_: Exception) {}

            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(applicationContext, Uri.parse(soundUri))
                setWakeMode(applicationContext, PowerManager.PARTIAL_WAKE_LOCK)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Unable to start alarm sound: ${e.message}")
        }
    }

    private fun startVibration() {
        val vibrator = getVibrator()
        val pattern = longArrayOf(0, 500, 300, 500)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, 0)
        }
    }

    private fun stopAlarm() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (_: Exception) {}
        try {
            audioManager.isSpeakerphoneOn = false
        } catch (_: Exception) {}
        abandonAlarmAudioFocus()
        getVibrator().cancel()
        releaseAlarmWakeLock()
    }

    private fun requestAlarmAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val attrs = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener { }
                    .build()
                audioFocusRequest = request
                audioManager.requestAudioFocus(request)
            } else {
                @Suppress("DEPRECATION")
                audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                )
            }
        } catch (_: Exception) {}
    }

    private fun abandonAlarmAudioFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
                audioFocusRequest = null
            } else {
                @Suppress("DEPRECATION")
                audioManager.abandonAudioFocus(null)
            }
        } catch (_: Exception) {}
    }

    @Suppress("DEPRECATION")
    private fun getVibrator(): Vibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        else
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

    // ── Notifications ──────────────────────────────────────────────────────────

    /** Silent persistent notification shown during tracking */
    private fun enterForegroundTracking() {
        val notification = buildTrackingNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            ServiceCompat.startForeground(this, TRACKING_NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(TRACKING_NOTIFICATION_ID, notification)
        }
    }

    /** Silent persistent notification shown during tracking */
    private fun buildTrackingNotification(): Notification {
        val openPi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, TRACKING_CHANNEL_ID)
            .setContentTitle("Tracking — $destinationName")
            .setContentText("Running in background. You'll be alerted on arrival.")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(openPi)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
        }
        return builder.build()
    }

    /** Full-screen alarm notification — pops up even on lock screen */
    private fun showAlarmNotification() {
        val alarmPi = PendingIntent.getActivity(
            this, 1,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(EXTRA_ALARM_TRIGGERED, true)
                putExtra(EXTRA_DESTINATION_NAME, destinationName)
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, ALARM_CHANNEL_ID)
            .setContentTitle("You've arrived!")
            .setContentText("$destinationName — tap to open app and stop alarm")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(alarmPi)
            .setFullScreenIntent(alarmPi, true)
            .build()

        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .notify(ALARM_NOTIFICATION_ID, notification)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Silent — no sound per location update
            val trackingChannel = NotificationChannel(
                TRACKING_CHANNEL_ID, "napz — tracking", NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Background location tracking for napz"
                setShowBadge(false)
                setSound(null, null)
            }

            // Max-priority alarm
            val alarmChannel = NotificationChannel(
                ALARM_CHANNEL_ID, "napz — arrival alarm", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alarm when you reach your destination in napz"
            }

            val mgr = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            mgr.createNotificationChannel(trackingChannel)
            mgr.createNotificationChannel(alarmChannel)
        }
    }

    // ── Math ───────────────────────────────────────────────────────────────────

    private fun haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6_371_000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        return r * 2 * atan2(sqrt(a), sqrt(1 - a))
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    override fun onDestroy() {
        stopLocationUpdates()
        locationListener = null
        locationManager = null
        stopAlarm()
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .cancel(ALARM_NOTIFICATION_ID)
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Only restart if the user still has an active trip + permissions + disclosure.
        try {
            if (TrackingSession.canStartLocationTracking(this)) {
                TrackingSession.startTrackingService(this)
            }
        } catch (_: Exception) {}
        super.onTaskRemoved(rootIntent)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
