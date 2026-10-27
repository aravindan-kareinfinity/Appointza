package com.wakemethere

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "Napz"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleAlarmIntent(intent)
        // Do NOT start FGS/location here. RN HomeScreen.loadSettings restores
        // active trips only after the in-app disclosure + permission flow.
        consumeResumeExtras(intent)
    }

    /** Called when app is already running and a new intent arrives (e.g. from service) */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAlarmIntent(intent)
        consumeResumeExtras(intent)
    }

    /**
     * Boot / notification may set RESUME_TRACKING — clear the pending flag so RN
     * can run disclosure-gated restore. Never start Fused location from Activity.
     */
    private fun consumeResumeExtras(intent: Intent?) {
        if (intent?.getBooleanExtra(TrackingSession.EXTRA_RESUME_TRACKING, false) == true) {
            intent.removeExtra(TrackingSession.EXTRA_RESUME_TRACKING)
        }
        // Leave pendingRestart set so RN can run disclosure-gated restore.
    }

    private fun handleAlarmIntent(intent: Intent?) {
        if (intent?.getBooleanExtra(TrackingForegroundService.EXTRA_ALARM_TRIGGERED, false) != true) return
        val destName = intent.getStringExtra(TrackingForegroundService.EXTRA_DESTINATION_NAME) ?: ""
        intent.removeExtra(TrackingForegroundService.EXTRA_ALARM_TRIGGERED)
        AlarmIntentHolder.setPendingFromAlarmIntent(destName)
    }
}
