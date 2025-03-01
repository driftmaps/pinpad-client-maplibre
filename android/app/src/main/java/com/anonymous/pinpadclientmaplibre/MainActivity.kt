package com.anonymous.pinpadclientmaplibre
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
    handleFileIntent(intent)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let { handleFileIntent(it) }
  }

  // Process intents for .drift files and send events to React Native
  private fun handleFileIntent(intent: Intent) {
    if (intent.action == Intent.ACTION_VIEW) {
      val uri: Uri? = intent.data
      if (uri != null && uri.toString().lowercase().endsWith(".drift")) {
        // Send the event via DriftFileUtil.
        DriftFileUtil.sendDriftFileEvent(uri.toString())
      }
    }
  }
}
