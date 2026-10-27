package com.wakemethere

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Shared tracking session state and safe service restart helpers.
 *
 * Boot-time FGS restart is DISABLED for Play policy clarity: after reboot the user
 * must open Napz so the RN disclosure/permission path can resume tracking.
 */
object TrackingSession {
    private const val TAG = "TrackingSession"

    const val PREFS = "napz_tracking"
    private const val LEGACY_PREFS = "wakemethere_tracking"
    const val PREF_DEST_NAME = "destName"
    const val PREF_DEST_LAT = "destLat"
    const val PREF_DEST_LNG = "destLng"
    const val PREF_RADIUS = "radius"
    const val PREF_SOUND_URI = "soundUri"
    const val PREF_PENDING_RESTART = "pendingRestartAfterBoot"
    // Versioned so an app update cannot reuse consent for obsolete disclosure wording.
    const val PREF_FG_DISCLOSURE = "fgDisclosureAcceptedV3"
    const val PREF_BG_DISCLOSURE = "bgDisclosureAcceptedV3"

    const val EXTRA_RESUME_TRACKING = "RESUME_TRACKING"

    private const val RESUME_CHANNEL_ID = "tracking_resume_channel"
    private const val RESUME_NOTIFICATION_ID = 1003

    fun sharedPrefs(context: Context): SharedPreferences {
        migrateLegacyPrefsIfNeeded(context)
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    }

    private fun migrateLegacyPrefsIfNeeded(context: Context) {
        val dest = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (dest.all.isNotEmpty()) return
        val src = context.getSharedPreferences(LEGACY_PREFS, Context.MODE_PRIVATE)
        if (src.all.isEmpty()) return
        val editor = dest.edit()
        for ((key, value) in src.all) {
            when (value) {
                is String -> editor.putString(key, value)
                is Boolean -> editor.putBoolean(key, value)
                is Int -> editor.putInt(key, value)
                is Long -> editor.putLong(key, value)
                is Float -> editor.putFloat(key, value)
            }
        }
        editor.apply()
        src.edit().clear().apply()
    }

    fun hasActiveSession(context: Context): Boolean {
        val name = sharedPrefs(context).getString(PREF_DEST_NAME, null)
        return !name.isNullOrBlank()
    }

    fun destinationName(context: Context): String? =
        sharedPrefs(context)
            .getString(PREF_DEST_NAME, null)
            ?.takeIf { it.isNotBlank() }

    fun markPendingRestart(context: Context) {
        sharedPrefs(context)
            .edit()
            .putBoolean(PREF_PENDING_RESTART, true)
            .apply()
    }

    fun clearPendingRestart(context: Context) {
        sharedPrefs(context)
            .edit()
            .remove(PREF_PENDING_RESTART)
            .apply()
    }

    fun isPendingRestart(context: Context): Boolean =
        sharedPrefs(context).getBoolean(PREF_PENDING_RESTART, false)

    fun hasForegroundDisclosure(context: Context): Boolean =
        sharedPrefs(context).getBoolean(PREF_FG_DISCLOSURE, false)

    fun hasBackgroundDisclosure(context: Context): Boolean =
        sharedPrefs(context).getBoolean(PREF_BG_DISCLOSURE, false)

    fun setDisclosureAccepted(context: Context, foreground: Boolean, background: Boolean) {
        Log.i(
            TAG,
            "LOCATION_AUDIT setDisclosureAccepted fg=$foreground bg=$background (user Agree only from JS)"
        )
        sharedPrefs(context)
            .edit()
            .putBoolean(PREF_FG_DISCLOSURE, foreground)
            .putBoolean(PREF_BG_DISCLOSURE, background)
            .apply()
    }

    fun hasFineLocationPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    fun hasBackgroundLocationPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    /** Foreground GPS / current position / position watch. */
    fun canAccessForegroundLocation(context: Context): Boolean =
        hasForegroundDisclosure(context) && hasFineLocationPermission(context)

    /** TrackingForegroundService / background trip GPS. */
    fun canAccessBackgroundLocation(context: Context): Boolean =
        hasForegroundDisclosure(context) &&
            hasBackgroundDisclosure(context) &&
            hasFineLocationPermission(context) &&
            hasBackgroundLocationPermission(context)

    /** True only when session + permissions + tracking disclosure allow FGS/location. */
    fun canStartLocationTracking(context: Context): Boolean {
        if (!hasActiveSession(context)) return false
        return canAccessBackgroundLocation(context)
    }

    fun deferRestartUntilUserInteraction(context: Context) {
        if (!hasActiveSession(context)) return
        markPendingRestart(context)
        showResumeNotification(context)
        Log.i(TAG, "Deferred tracking restart until user opens Napz (no boot FGS)")
    }

    /**
     * Ends a trip without revoking explicit Continue consent.
     */
    fun clearActiveSessionKeepDisclosure(context: Context) {
        sharedPrefs(context)
            .edit()
            .remove(PREF_DEST_NAME)
            .remove(PREF_DEST_LAT)
            .remove(PREF_DEST_LNG)
            .remove(PREF_RADIUS)
            .remove(PREF_SOUND_URI)
            .remove(PREF_PENDING_RESTART)
            .apply()
    }

    fun startTrackingService(context: Context) {
        if (!canAccessBackgroundLocation(context)) {
            Log.w(TAG, "Refusing to start FGS: disclosure or location permission missing")
            return
        }
        startTrackingServiceInternal(context)
    }

    private fun startTrackingServiceInternal(context: Context) {
        val svcIntent = Intent(context, TrackingForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svcIntent)
        } else {
            context.startService(svcIntent)
        }
    }

    private fun showResumeNotification(context: Context) {
        val appContext = context.applicationContext
        val dest = destinationName(appContext) ?: "your destination"
        ensureResumeChannel(appContext)

        val openIntent = Intent(appContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_RESUME_TRACKING, true)
        }
        val pendingIntent = PendingIntent.getActivity(
            appContext,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(appContext, RESUME_CHANNEL_ID)
            .setContentTitle("Resume Napz tracking")
            .setContentText("Open Napz to continue tracking to $dest")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val mgr = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.notify(RESUME_NOTIFICATION_ID, notification)
    }

    private fun cancelResumeNotification(context: Context) {
        val mgr = context.applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.cancel(RESUME_NOTIFICATION_ID)
    }

    private fun ensureResumeChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            RESUME_CHANNEL_ID,
            "Resume tracking",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Prompts you to resume destination tracking after device restart"
        }
        val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.createNotificationChannel(channel)
    }
}
