package com.dataclient.benchmarknative

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.Debug
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Choreographer
import android.view.FrameMetrics
import android.view.Window
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.lang.ref.WeakReference
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Aggregate-only native probes: UI frame timing (no per-frame bridge calls),
 * process memory snapshots, launch extras, report I/O, and embedded build manifest.
 *
 * FrameMetrics TOTAL_DURATION is a duration → ceil(duration/period)−1.
 * Choreographer deltas are intervals → round(interval/period)−1.
 */
class BenchNativeModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  private val mainHandler = Handler(Looper.getMainLooper())
  private var capturing = false
  private var captureSource: String = "none"
  private var frameMetricsListener: Window.OnFrameMetricsAvailableListener? = null
  private var captureWindowRef: WeakReference<Window>? = null
  private var choreographerCallback: Choreographer.FrameCallback? = null
  private var lastChoreographerNs: Long = 0L

  private var frameCount = 0
  private var maxFrameDurationNs = 0L
  private var totalFrameDurationNs = 0L
  private var missedFrames = 0
  private var refreshPeriodNs = 16_666_666L
  private var refreshRateHz = 60.0

  override fun invalidate() {
    // Tear down listeners on the main thread so activity recreation cannot leak.
    mainHandler.post { stopCaptureInternal(idempotent = true) }
    super.invalidate()
  }

  @ReactMethod
  fun getLaunchConfig(promise: Promise) {
    try {
      val extras = MainActivity.launchExtras
      val map = Arguments.createMap()
      map.putBoolean("autoRun", extras?.getBoolean("autoRun", false) ?: false)
      putExtraString(map, extras, "candidateKind")
      putExtraString(map, extras, "pattern")
      putExtraString(map, extras, "control")
      putExtraString(map, extras, "label")
      if (extras != null && extras.containsKey("count")) {
        map.putInt("count", extras.getInt("count", 1000))
      }
      if (extras != null && extras.containsKey("samples")) {
        map.putInt("samples", extras.getInt("samples", 1))
      }
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("LAUNCH_CONFIG", e)
    }
  }

  @ReactMethod
  fun getBuildManifest(promise: Promise) {
    try {
      val json =
        reactContext.assets.open(BUILD_MANIFEST_ASSET).bufferedReader().use { it.readText() }
      val map = Arguments.createMap()
      map.putString("json", json)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject(
        "BUILD_MANIFEST",
        "build-manifest.json missing — run yarn build:android:release (prepare→gradle→finalize)",
        e,
      )
    }
  }

  @ReactMethod
  fun getEnvironment(promise: Promise) {
    try {
      val activity = reactContext.currentActivity
      val display =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          activity?.display
        } else {
          @Suppress("DEPRECATION")
          activity?.windowManager?.defaultDisplay
        }
      val hz = display?.refreshRate?.toDouble() ?: 60.0
      val periodMs = if (hz > 0) 1000.0 / hz else 1000.0 / 60.0

      val map = Arguments.createMap()
      map.putInt("apiLevel", Build.VERSION.SDK_INT)
      map.putString("release", Build.VERSION.RELEASE ?: "")
      map.putString("manufacturer", Build.MANUFACTURER ?: "")
      map.putString("model", Build.MODEL ?: "")
      map.putString("device", Build.DEVICE ?: "")
      map.putString("brand", Build.BRAND ?: "")
      map.putString(
        "buildType",
        if (BuildConfig.DEBUG) "debug" else "release",
      )
      map.putString("applicationId", BuildConfig.APPLICATION_ID)
      map.putBoolean("hermesEnabled", isHermesEnabled())
      map.putDouble("refreshRateHz", hz)
      map.putDouble("refreshPeriodMs", periodMs)

      val hermesProps = Arguments.createMap()
      hermesProps.putString("BuildConfig.IS_HERMES_ENABLED", isHermesEnabled().toString())
      try {
        val clazz = Class.forName("com.facebook.react.common.build.ReactBuildConfig")
        val field = clazz.getField("IS_HERMES_ENABLED")
        hermesProps.putString("ReactBuildConfig.IS_HERMES_ENABLED", field.getBoolean(null).toString())
      } catch (_: Throwable) {
        // optional
      }
      map.putMap("hermesRuntimeProperties", hermesProps)

      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("ENVIRONMENT", e)
    }
  }

  @ReactMethod
  fun getMemorySnapshot(promise: Promise) {
    try {
      val info = Debug.MemoryInfo()
      Debug.getMemoryInfo(info)
      val map = Arguments.createMap()
      map.putInt("totalPssKb", info.totalPss)
      map.putInt("totalPrivateDirtyKb", info.totalPrivateDirty)
      if (Build.VERSION.SDK_INT >= 34) {
        try {
          val rssBytes =
            android.os.Process::class.java
              .getMethod("getRssInBytes")
              .invoke(null) as Long
          map.putDouble("rssKb", rssBytes / 1024.0)
        } catch (_: Throwable) {
          // omit rssKb
        }
      }
      val am = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      map.putInt("memoryClassMb", am.memoryClass)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("MEMORY", e)
    }
  }

  @ReactMethod
  fun startUiFrameCapture(promise: Promise) {
    mainHandler.post {
      try {
        if (capturing) {
          promise.reject("ALREADY_CAPTURING", "UI frame capture already running")
          return@post
        }
        resetCaptureCounters()
        val activity = reactContext.currentActivity
        if (activity == null) {
          promise.reject("NO_ACTIVITY", "No current activity for frame capture")
          return@post
        }
        updateRefreshPeriod(activity)
        if (refreshPeriodNs <= 0L || refreshRateHz <= 0.0) {
          promise.reject("INVALID_REFRESH", "refresh period/rate must be positive")
          return@post
        }

        val window = activity.window
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && window != null) {
          val listener =
            Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
              val totalNs = frameMetrics.getMetric(FrameMetrics.TOTAL_DURATION)
              recordFrameMetricsDuration(totalNs)
            }
          window.addOnFrameMetricsAvailableListener(listener, mainHandler)
          frameMetricsListener = listener
          captureWindowRef = WeakReference(window)
          captureSource = "FrameMetrics"
          capturing = true
          val result = Arguments.createMap()
          result.putBoolean("started", true)
          result.putString("source", captureSource)
          promise.resolve(result)
        } else {
          startChoreographerCapture(promise)
        }
      } catch (e: Exception) {
        try {
          startChoreographerCapture(promise)
        } catch (e2: Exception) {
          promise.reject("FRAME_CAPTURE_START", e2)
        }
      }
    }
  }

  @ReactMethod
  fun stopUiFrameCapture(promise: Promise) {
    mainHandler.post {
      try {
        // Idempotent: safe for finally/cleanup when already stopped.
        val map = stopCaptureInternal(idempotent = true)
        promise.resolve(map)
      } catch (e: Exception) {
        capturing = false
        promise.reject("FRAME_CAPTURE_STOP", e)
      }
    }
  }

  @ReactMethod
  fun writeReport(json: String, promise: Promise) {
    try {
      val file = File(reactContext.filesDir, REPORT_FILE)
      file.writeText(json)
      Log.i(LOG_TAG, "REPORT_READY path=${file.absolutePath} bytes=${json.length}")
      val map = Arguments.createMap()
      map.putString("path", file.absolutePath)
      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("WRITE_REPORT", e)
    }
  }

  private fun stopCaptureInternal(idempotent: Boolean): WritableMap {
    if (capturing) {
      val listener = frameMetricsListener
      val window = captureWindowRef?.get() ?: reactContext.currentActivity?.window
      if (listener != null && window != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        try {
          window.removeOnFrameMetricsAvailableListener(listener)
        } catch (_: Throwable) {
          // ignore — activity may already be gone
        }
      }
      frameMetricsListener = null
      captureWindowRef = null

      val cb = choreographerCallback
      if (cb != null) {
        try {
          Choreographer.getInstance().removeFrameCallback(cb)
        } catch (_: Throwable) {
          // ignore
        }
      }
      choreographerCallback = null
      capturing = false
    } else if (!idempotent) {
      throw IllegalStateException("UI frame capture is not running")
    }

    val map = Arguments.createMap()
    map.putString("source", captureSource)
    map.putInt("frameCount", frameCount)
    map.putDouble("maxFrameDurationMs", maxFrameDurationNs / 1_000_000.0)
    map.putDouble("totalFrameDurationMs", totalFrameDurationNs / 1_000_000.0)
    map.putInt("missedFrames", missedFrames)
    map.putDouble("refreshPeriodMs", refreshPeriodNs / 1_000_000.0)
    map.putDouble("refreshRateHz", refreshRateHz)
    map.putBoolean("wasCapturing", frameCount > 0 || captureSource != "none")
    return map
  }

  private fun startChoreographerCapture(promise: Promise) {
    lastChoreographerNs = 0L
    val callback =
      object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
          if (!capturing) return
          if (lastChoreographerNs > 0L) {
            recordChoreographerInterval(frameTimeNanos - lastChoreographerNs)
          }
          lastChoreographerNs = frameTimeNanos
          Choreographer.getInstance().postFrameCallback(this)
        }
      }
    choreographerCallback = callback
    captureSource = "Choreographer"
    capturing = true
    Choreographer.getInstance().postFrameCallback(callback)
    val result = Arguments.createMap()
    result.putBoolean("started", true)
    result.putString("source", captureSource)
    promise.resolve(result)
  }

  /** FrameMetrics TOTAL_DURATION — duration semantics (ceil). */
  private fun recordFrameMetricsDuration(durationNs: Long) {
    if (durationNs <= 0L) return
    frameCount++
    totalFrameDurationNs += durationNs
    if (durationNs > maxFrameDurationNs) {
      maxFrameDurationNs = durationNs
    }
    if (refreshPeriodNs > 0L) {
      val periods = ceil(durationNs.toDouble() / refreshPeriodNs.toDouble()).toInt()
      missedFrames += max(0, periods - 1)
    }
  }

  /** Choreographer frame-time delta — interval semantics (round). */
  private fun recordChoreographerInterval(intervalNs: Long) {
    if (intervalNs <= 0L) return
    frameCount++
    totalFrameDurationNs += intervalNs
    if (intervalNs > maxFrameDurationNs) {
      maxFrameDurationNs = intervalNs
    }
    if (refreshPeriodNs > 0L) {
      val periods = (intervalNs.toDouble() / refreshPeriodNs.toDouble()).roundToInt()
      missedFrames += max(0, periods - 1)
    }
  }

  private fun resetCaptureCounters() {
    frameCount = 0
    maxFrameDurationNs = 0L
    totalFrameDurationNs = 0L
    missedFrames = 0
    lastChoreographerNs = 0L
    captureSource = "none"
    captureWindowRef = null
  }

  private fun updateRefreshPeriod(activity: android.app.Activity) {
    val display =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        activity.display
      } else {
        @Suppress("DEPRECATION")
        activity.windowManager?.defaultDisplay
      }
    val hz = display?.refreshRate?.toDouble() ?: 60.0
    refreshRateHz = if (hz > 0) hz else 60.0
    refreshPeriodNs = (1_000_000_000.0 / refreshRateHz).toLong()
  }

  private fun isHermesEnabled(): Boolean {
    return try {
      BuildConfig::class.java.getField("IS_HERMES_ENABLED").getBoolean(null)
    } catch (_: Throwable) {
      true
    }
  }

  private fun putExtraString(map: WritableMap, extras: Bundle?, key: String) {
    val value = extras?.getString(key)
    if (value != null) {
      map.putString(key, value)
    }
  }

  companion object {
    const val NAME = "BenchNative"
    const val LOG_TAG = "BenchNative"
    const val REPORT_FILE = "gc-report.json"
    const val BUILD_MANIFEST_ASSET = "build-manifest.json"
  }
}
