#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTBridge.h>

@implementation AppDelegate

// Initialize the React Native app
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// Configure the JavaScript bundle location
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Handle deep links and .drift file URIs
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  // Handle .drift files by sending events to React Native
  // The file URI will be in the format file:///path/to/file.drift
  if ([[url pathExtension].lowercaseString isEqualToString:@"drift"]) {
    // Attempt to get the existing RN bridge from the rootViewController.
    // If your project is structured differently, adjust accordingly.
    UIWindow *window = self.window;
    UIViewController *rootVC = window.rootViewController;
    if ([rootVC respondsToSelector:@selector(bridge)]) {
      RCTBridge *bridge = [rootVC valueForKey:@"bridge"];
      if (bridge) {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [bridge.eventDispatcher sendAppEventWithName:@"DriftFileOpened"
                                              body:@{ @"filePath": url.absoluteString }];
        #pragma clang diagnostic pop
        NSLog(@"Received .drift file: %@", url.absoluteString);
        return YES; // Mark it handled
      }
    }
    // If the bridge isn't ready, you could store `url` for later.
  }

  // Handle standard deep link URIs via Expo's Linking system
  BOOL handledBySuper = [super application:application openURL:url options:options];
  BOOL handledByLinkingManager = [RCTLinkingManager application:application openURL:url options:options];
  return handledBySuper || handledByLinkingManager;
}

// Handle Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL linkingManagerHandled = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  BOOL superHandled = [super application:application
                     continueUserActivity:userActivity
                         restorationHandler:restorationHandler];
  return superHandled || linkingManagerHandled;
}

// Remote notification handling methods required for compatibility
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
