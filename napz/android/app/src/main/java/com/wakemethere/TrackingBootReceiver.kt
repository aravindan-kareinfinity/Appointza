package com.wakemethere

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * After reboot / package replace: NEVER start location FGS from the receiver.
 * Prompt the user to open Napz; RN restores tracking via disclosure-gated loadSettings.
 */
class TrackingBootReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "TrackingBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (
            action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return

        if (!TrackingSession.hasActiveSession(context)) return

        Log.i(TAG, "Active session after $action — deferring (no FGS from boot)")
        TrackingSession.deferRestartUntilUserInteraction(context)
    }
}
