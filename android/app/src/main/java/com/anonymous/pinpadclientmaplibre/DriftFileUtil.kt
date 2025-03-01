package com.anonymous.pinpadclientmaplibre
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object DriftFileUtil {
  fun sendDriftFileEvent(fileUri: String) {
    Log.d("DriftFileUtil", "Sending DriftFileOpened event with fileUri: $fileUri")
    MainApplication.reactContext?.let { reactContext: ReactContext ->
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("DriftFileOpened", fileUri)
    }
  }
}
