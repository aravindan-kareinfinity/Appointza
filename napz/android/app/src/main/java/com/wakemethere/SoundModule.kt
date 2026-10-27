package com.wakemethere

import android.media.MediaPlayer
import android.os.Vibrator
import android.os.VibratorManager
import android.content.Context
import android.os.Build
import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class SoundModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var mediaPlayer: MediaPlayer? = null

    override fun getName(): String = "SoundModule"

    @ReactMethod
    fun playSound(soundFilePath: String, promise: Promise) {
        try {
            if (mediaPlayer != null) {
                mediaPlayer?.release()
            }

            mediaPlayer = MediaPlayer().apply {
                val uri = Uri.parse(soundFilePath)
                setDataSource(reactApplicationContext, uri)
                
                // Set to ALARM stream (loudest and always plays)
                setAudioStreamType(android.media.AudioManager.STREAM_ALARM)
                
                // Set audio attributes for better control
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    setAudioAttributes(
                        android.media.AudioAttributes.Builder()
                            .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                }
                
                prepareAsync()
                setOnPreparedListener { mp ->
                    mp.start()
                }
                setOnCompletionListener {
                    release()
                    mediaPlayer = null
                }
                setOnErrorListener { _, what, extra ->
                    promise.reject("SOUND_ERROR", "MediaPlayer error: what=$what extra=$extra")
                    false
                }
            }
            promise.resolve("Sound playing")
        } catch (e: Exception) {
            promise.reject("SOUND_ERROR", "Failed to play sound: ${e.message}")
        }
    }

    @ReactMethod
    fun stopSound(promise: Promise) {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
            mediaPlayer = null
            promise.resolve("Sound stopped")
        } catch (e: Exception) {
            promise.reject("SOUND_ERROR", "Failed to stop sound: ${e.message}")
        }
    }

    @ReactMethod
    fun vibrate(duration: Double, promise: Promise) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (reactApplicationContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                reactApplicationContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            val durationLong = duration.toLong()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(durationLong, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(durationLong)
            }
            promise.resolve("Vibration triggered")
        } catch (e: Exception) {
            promise.reject("VIBRATION_ERROR", "Failed to vibrate: ${e.message}")
        }
    }
}
