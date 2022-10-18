package com.courierreactnative

import android.content.Intent
import android.os.Bundle
import com.courier.android.Courier
import com.courier.android.trackPushNotificationClick
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.RemoteMessage

open class CourierReactNativeActivity : ReactActivity() {

  companion object {
    private const val COMPONENT_NAME = "main"
    internal const val PUSH_CLICKED_EVENT = "pushNotificationClicked"
    internal const val PUSH_DELIVERED_EVENT = "pushNotificationDelivered"
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String? {
    return COMPONENT_NAME
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. There the RootView is created and
   * you can specify the rendered you wish to use (Fabric or the older renderer).
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return MainActivityDelegate(this, mainComponentName)
  }

  class MainActivityDelegate(activity: ReactActivity?, mainComponentName: String?) : ReactActivityDelegate(activity, mainComponentName) {

    override fun createRootView(): ReactRootView {
      val reactRootView = ReactRootView(context)
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(false)
      return reactRootView
    }

  }

  private fun sendEvent(eventName: String, params: WritableMap) {
    reactInstanceManager.currentReactContext?.let { context ->
      context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)?.emit(eventName, params)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // See if there is a pending click event
    checkIntentForPushNotificationClick(intent)

    // Handle delivered messages on the main thread
    Courier.getLastDeliveredMessage { message ->
      postPushNotificationDelivered(message)
    }

  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    checkIntentForPushNotificationClick(intent);
  }

  private fun checkIntentForPushNotificationClick(intent: Intent?) {
    intent?.trackPushNotificationClick { message ->
      postPushNotificationClicked(message)
    }
  }

  private fun mapToWritableMap(mappedData: Map<String, String>): WritableMap {
    val convertedMap = Arguments.createMap()
    mappedData.forEach { entry ->
      convertedMap.putString(entry.key, entry.value);
    }
    return convertedMap
  }

  private fun postPushNotificationDelivered(message: RemoteMessage) {
    sendEvent(PUSH_DELIVERED_EVENT, mapToWritableMap(message.data))
  }

  private fun postPushNotificationClicked(message: RemoteMessage) {
    sendEvent(PUSH_CLICKED_EVENT, mapToWritableMap(message.data));
  }
}
