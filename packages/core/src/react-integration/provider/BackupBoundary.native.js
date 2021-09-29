/* eslint-disable react/prop-types */
import React, { Suspense, memo, useEffect } from 'react';
import { Text, Linking, View } from 'react-native';

function BackupBoundary({ children }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
export default memo(BackupBoundary);

function Loading() {
  let message = <Text>loading...</Text>;
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    // env should not change during runtime and this excludes from build
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      console.warn(
        `Uncaught suspense.
Make sure to add your own Suspense boundaries: https://resthooks.io/docs/getting-started/data-dependency#async-fallbacks`,
      );
    }, []);

    message = (
      <>
        <Text>Uncaught Suspense.</Text>
        <Text>
          Try
          <Text
            style={{ color: 'blue' }}
            onPress={() =>
              Linking.openURL(
                'https://resthooks.io/docs/getting-started/data-dependency#async-fallbacks',
              )
            }
          >
            adding a suspense boundary
          </Text>
        </Text>
      </>
    );
  }
  return <View>{message}</View>;
}
