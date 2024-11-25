import React from "react";
import { StyleSheet, View } from "react-native";
import styleJSON from "./assets/map_styles/style.json";
import MapLibreGL from "@maplibre/maplibre-react-native";

MapLibreGL.setAccessToken(null); // No token needed for custom tile servers

export default function App() {
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={styles.map} styleJSON={styleJSON}>
        <MapLibreGL.Camera
          zoomLevel={5}
          centerCoordinate={[-73.72826520392081, 45.584043985983]}
        />
        <MapLibreGL.VectorSource
          id="custom-tiles"
          tileUrlTemplates={["http://localhost:8080/data/{z}/{x}/{y}.pbf"]}
          minZoomLevel={5}
          maxZoomLevel={14}
        >
          <MapLibreGL.FillLayer
            id="land"
            sourceID="custom-tiles"
            sourceLayerID="landcover"
            style={{ fillColor: "#3388ff" }}
          />
          <MapLibreGL.LineLayer
          id="buildings"
          sourceID="custom-tiles"
          sourceLayerID="building"
          style={{ lineColor: "#198EC8" }}
          />
        </MapLibreGL.VectorSource>
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});