import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import * as CourierPush from '@trycourier/courier-react-native';
import { userId, authToken } from './config/constants';
import { Token, Button } from './components';

type NotificationType = {
  body: string;
  title: string;
  trackingUrl: string;
};

const addNotificationListeners = (cb: any) =>
  CourierPush.registerPushNotificationListeners<NotificationType>({
    onNotificationClicked: (notification) => {
      console.log('clicked', notification);
      cb(JSON.stringify(notification));
      showToast(`notification clicked  \n ${notification.title}`);
    },
    onNotificationDelivered: (notification) => {
      console.log('delivered', notification);
      showToast(`notification delivered \n ${notification.title}`);
    },
  });

const showToast = (toastMessage: string) => {
  ToastAndroid.showWithGravity(
    toastMessage,
    ToastAndroid.SHORT,
    ToastAndroid.CENTER
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string | undefined>('');
  const [signedInUserId, setSignedInUserId] = useState<string | undefined>('');
  const [isClickedData, setIsClickedData] = useState('test');

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await CourierPush.signIn({ userId, authToken });
      showToast(res);
      setIsSignedIn(true);
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const res = await CourierPush.signOut();
      showToast(res);
      setIsSignedIn(false);
      setFcmToken('');
      setSignedInUserId('');
    } catch (err: any) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPush = async () => {
    try {
      const res = await CourierPush.sendPush({
        authKey: authToken,
        userId,
        providers: [CourierPush.CourierProvider.FCM],
      });
      showToast(res);
    } catch (err: any) {
      showToast(err);
    }
  };

  const handleGetFcmToken = async () => {
    try {
      const fcmToken = await CourierPush.getFcmToken();
      setFcmToken(fcmToken);
    } catch (err: any) {
      console.log(err);
    }
  };

  const handleGetUserId = async () => {
    try {
      const fcmToken = await CourierPush.getUserId();
      setSignedInUserId(fcmToken);
    } catch (err: any) {
      console.log(err);
    }
  };

  const init = async () => {
    try {
      const unsubscribeAddNotificationListener =
        addNotificationListeners(setIsClickedData);
      const unsubscribeDebugListener = CourierPush.debuggerListener();

      const requestStatus = await CourierPush.requestNotificationPermission();
      const notificationPermissionStatus =
        await CourierPush.getNotificationPermissionStatus();
      console.log('notificationPermissionStatus', notificationPermissionStatus);
      showToast(requestStatus);
      if (requestStatus === 'denied') return;
      handleSignIn();
      return () => {
        unsubscribeAddNotificationListener();
        unsubscribeDebugListener();
      };
    } catch (e: any) {
      console.log(e);
      showToast(e);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      unsubscribe = await init();
    })();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  if (isLoading)
    return (
      <View style={styles.container}>{isLoading && <ActivityIndicator />}</View>
    );

  return (
    <View style={styles.container}>
      <View
        style={{
          backgroundColor: 'black',
          minHeight: 100,
          minWidth: 100,
          marginTop: 100,
        }}
      >
        <Text style={{ backgroundColor: 'black' }}>{isClickedData}</Text>
      </View>
      <Button
        title="Start Debugging"
        onPress={() => CourierPush.setDebugMode(true)}
      />
      <Button
        title="Stop Debugging"
        onPress={() => CourierPush.setDebugMode(false)}
      />

      <Text style={styles.signInStatus}>
        {isSignedIn ? 'Signed In' : 'Not Signed In'}
      </Text>
      {isSignedIn ? (
        <Button title="Sign out" onPress={handleSignOut} />
      ) : (
        <Button title="Sign in" onPress={handleSignIn} />
      )}
      {isSignedIn && (
        <>
          <Button title="Send Push" onPress={handleSendPush} />
        </>
      )}
      <Button title="Get Fcm Token" onPress={handleGetFcmToken} />
      <Button title="Get User Id" onPress={handleGetUserId} />
      <Token title="fcm Token" token={fcmToken} />
      <Token title="User Id" token={signedInUserId} />
    </View>
  );
}

const styles = StyleSheet.create({
  signInStatus: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    margin: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  divider: {
    marginVertical: 12,
  },
  buttonStyle: {
    padding: 12,
    backgroundColor: '#008CBA',
    borderRadius: 4,
    margin: 12,
  },
  buttonTextStyle: {
    color: 'white',
  },
});
