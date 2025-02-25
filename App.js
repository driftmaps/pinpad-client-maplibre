import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Linking,
  Platform,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as FileSystem from "expo-file-system";
import { useTileManager } from "./hooks/useTileManager";

async function copyToCache(fileUrl) {
  try {
    const localPath = FileSystem.cacheDirectory + "downloaded.drift";
    console.log(`localPath is ${localPath}`);
    await FileSystem.copyAsync({ from: fileUrl, to: localPath });
    return localPath;
  } catch (error) {
    console.error("Failed to pull file into app cache: ", error);
    return null;
  }
}

export default function App() {
  const { tileManager, isLoading, error } = useTileManager();
  const [styleUrl, setStyleUrl] = useState(null);

  console.log("calling App");

  // Process a drift file URL.
  const handleDriftUrl = async (url) => {
    console.log("Drift file URL detected:", url);

    // Skip expo development client URLs.
    if (url.startsWith("exp+pinpad-client-maplibre://")) {
      console.log("Ignoring development URL:", url);
      return;
    }

    let localPath = await copyToCache(url);

    if (!localPath) {
      console.error("Failed to get local file path.");
      return;
    }

    // Process the drift file.
    await tileManager.processDriftFile(localPath);

    try {
      const baseStyleUrl = tileManager.getStyleUrl();
      // Update a separate version (to be used as the key)
      const version = new Date().getTime();
      setStyleUrl({ base: baseStyleUrl, version });
    } catch (err) {
      console.error(err);
    }
  };

  // Process the initial URL at launch.
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log("Initial URL detected:", url);
          handleDriftUrl(url);
        }
      })
      .catch((err) => {
        console.log("Error getting initial URL", err);
      });
  }, [tileManager]);

  // Listen for URL events while the app is running.
  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("URL event received:", event.url);
      handleDriftUrl(event.url);
    });
    return () => {
      subscription.remove();
    };
  }, [tileManager]);

  useEffect(() => {
    if (global.HermesInternal) {
      console.log("Hermes is enabled.");
    } else {
      console.log("Hermes is not enabled.");
    }
    MapLibreGL.setAccessToken(null);
  }, []);

  if (isLoading) {
    return <ActivityIndicator />;
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        key={styleUrl?.version} // <== Force mount when styleUrl changes.
        style={styles.map}
        styleURL={styleUrl?.base || tileManager.getStyleUrl()}
        testID="map-view"
      >
        <MapLibreGL.Camera
          zoomLevel={9}
          centerCoordinate={tileManager.getCenterCoordinate()} // now uses the packaged center
          minZoomLevel={5}
          maxZoomLevel={14}
        />
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
