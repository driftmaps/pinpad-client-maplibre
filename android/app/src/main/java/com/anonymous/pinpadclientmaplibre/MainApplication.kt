package com.anonymous.pinpadclientmaplibre

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.facebook.react.bridge.ReactContext
import com.facebook.react.ReactInstanceEventListener

class MainApplication : Application(), ReactApplication {

  companion object {
    // Store React context globally for access from native code
    var reactContext: ReactContext? = null
  }

  // Configure the React Native host with necessary packages and settings
  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          // Set up React Native packages (auto-linked and manual)
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here.
            return packages
          }

          // Configure React Native settings
          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )

  // Create React host instance
  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // Initialize native code loader
    SoLoader.init(this, OpenSourceMergedSoMapping)
    
    // Set up new architecture if enabled
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }

    // Store React context when it's initialized
    reactNativeHost.reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
        override fun onReactContextInitialized(reactContext: ReactContext) {
            MainApplication.reactContext = reactContext
        }
    })

    // Initialize Expo lifecycle management
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  // Handle configuration changes (e.g., rotation) with Expo
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
