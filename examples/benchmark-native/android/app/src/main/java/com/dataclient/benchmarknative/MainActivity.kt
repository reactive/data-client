package com.dataclient.benchmarknative

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "BenchmarkNative"

  override fun onCreate(savedInstanceState: Bundle?) {
    launchExtras = intent?.extras
    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    launchExtras = intent.extras
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  companion object {
    @JvmField var launchExtras: Bundle? = null
  }
}
