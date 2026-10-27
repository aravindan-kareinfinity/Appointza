package com.wakemethere

/**
 * Survives the gap between [MainActivity] handling the notification Intent and React mounting.
 * [reactInstanceManager] / bridge emit is unreliable for cold start on RN 0.85+; JS calls
 * [TrackingServiceModule.getPendingAlarmLaunch] after listeners are ready.
 */
object AlarmIntentHolder {
    @Volatile
    var pendingDestinationName: String? = null
        private set

    fun setPendingFromAlarmIntent(destinationName: String) {
        pendingDestinationName = destinationName
    }

    /**
     * Returns and clears the pending destination, if any, so navigation runs once.
     */
    fun takePendingDestinationName(): String? {
        val v = pendingDestinationName
        pendingDestinationName = null
        return v
    }
}
