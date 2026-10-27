# Keep RN native modules used by Napz (no broad app-wide keeps).
-keep class com.wakemethere.TrackingServiceModule { *; }
-keep class com.wakemethere.SoundModule { *; }
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-keep class com.android.vending.billing.** { *; }
-keep class com.dooboolab.** { *; }
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.internal.consent_sdk.** { *; }