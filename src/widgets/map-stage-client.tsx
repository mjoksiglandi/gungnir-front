"use client";

import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Alert, Asset, GeoLayer, Incident } from "@/shared/contracts/operational";
import { formatPercent } from "@/shared/lib/format";
import { divIcon, type LatLngExpression } from "leaflet";
import {
  Circle as LeafletCircle,
  CircleMarker as LeafletCircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import styles from "./map-stage.module.css";

type BasemapMode = "map" | "satellite";

type LayerState = {
  airTraffic: boolean;
  groundTraffic: boolean;
  incidents: boolean;
  routes: boolean;
  geofences: boolean;
  heatZones: boolean;
  labels: boolean;
};

type FireHotspot = {
  id: number;
  lat: number;
  lon: number;
  brightness: number;
  confidence: number;
  frp: number;
  hoursOld: number;
  acquiredAt: string;
};

type DrawnGeofence = {
  id: string;
  name: string;
  polygon: Array<{ lat: number; lon: number }>;
};

const CHILE_FIRE_BBOX = [-74.8, -38.1, -70.6, -36.1] as const;

function statusColor(status: Asset["status"]) {
  if (status === "nominal") return "#56d974";
  if (status === "degraded") return "#f0b24e";
  return "#f04f63";
}

function alertColor(severity: Alert["severity"]) {
  if (severity === "critical") return "#ff5a6f";
  if (severity === "high") return "#ff7b39";
  if (severity === "medium") return "#f2b24d";
  return "#7ad6ff";
}

function assetGlyph(assetType: Asset["assetType"]) {
  if (assetType === "air") return "✈";
  if (assetType === "ground") return "▣";
  if (assetType === "autonomous") return "△";
  if (assetType === "personnel") return "●";
  return "◉";
}

function assetIcon(asset: Asset) {
  const color = statusColor(asset.status);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.assetMarkerShell}">
        <div class="${styles.assetMarker}" style="--status-color:${color}">
          <span class="${styles.assetGlyph}">${assetGlyph(asset.assetType)}</span>
        </div>
        <div class="${styles.assetLabel}">
          <strong>${asset.callsign}</strong>
          <span>${asset.name}</span>
        </div>
      </div>
    `,
    iconSize: [126, 40],
    iconAnchor: [14, 14],
  });
}

function incidentIcon(severity: Alert["severity"]) {
  const color = alertColor(severity);

  return divIcon({
    className: styles.assetIconWrapper,
    html: `
      <div class="${styles.incidentIconShell}">
        <div class="${styles.incidentIcon}" style="--incident-color:${color}">
          !
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function MapDrawingCapture({
  enabled,
  onAddPoint,
}: Readonly<{
  enabled: boolean;
  onAddPoint: (point: { lat: number; lon: number }) => void;
}>) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      onAddPoint({
        lat: event.latlng.lat,
        lon: event.latlng.lng,
      });
    },
  });

  return null;
}

function layerPositions(layer: GeoLayer): LatLngExpression[] {
  return layer.polygon.map(({ lat, lon }) => [lat, lon]);
}

export function MapStageClient({
  alerts,
  assets,
  incidents,
  layers,
}: Readonly<{
  alerts: Alert[];
  assets: Asset[];
  incidents: Incident[];
  layers: GeoLayer[];
}>) {
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [showDeviceSidebar, setShowDeviceSidebar] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<"all" | Asset["assetType"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("map");
  const [fireHotspots, setFireHotspots] = useState<FireHotspot[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Array<{ lat: number; lon: number }>>([]);
  const [drawnGeofences, setDrawnGeofences] = useState<DrawnGeofence[]>([]);
  const [layerState, setLayerState] = useState<LayerState>({
    airTraffic: true,
    groundTraffic: true,
    incidents: true,
    routes: true,
    geofences: true,
    heatZones: true,
    labels: true,
  });

  const center: LatLngExpression = [-33.454, -70.655];
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = deviceFilter === "all" || asset.assetType === deviceFilter;
    const searchValue = `${asset.callsign} ${asset.name} ${asset.assetType}`.toLowerCase();
    const matchesSearch = searchValue.includes(searchQuery.trim().toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const visibleAssets = assets.filter((asset) => {
    if (asset.assetType === "air") return layerState.airTraffic;
    return layerState.groundTraffic;
  });

  const routePath = useMemo<LatLngExpression[]>(
    () => assets
      .filter((asset) => asset.assetType === "air" || asset.assetType === "autonomous")
      .map((asset) => [asset.position.lat, asset.position.lon]),
    [assets],
  );

  const incidentSignals = useMemo(() => {
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    return alerts.flatMap((alert, index) => {
      const anchorAsset = alert.assetId ? assetById.get(alert.assetId) : null;

      if (!anchorAsset) return [];

      return [{
        id: alert.id,
        title: alert.title,
        severity: alert.severity,
        status: alert.status,
        zoneLat: anchorAsset.position.lat + (index * 0.0025) - 0.0015,
        zoneLon: anchorAsset.position.lon + (index * 0.003) + 0.001,
        anchorLat: anchorAsset.position.lat,
        anchorLon: anchorAsset.position.lon,
      }];
    });
  }, [alerts, assets]);

  useEffect(() => {
    let cancelled = false;

    async function loadFireHotspots() {
      try {
        const [xmin, ymin, xmax, ymax] = CHILE_FIRE_BBOX;
        const params = new URLSearchParams({
          where: "HOURS_OLD <= 48",
          geometry: `${xmin},${ymin},${xmax},${ymax}`,
          geometryType: "esriGeometryEnvelope",
          inSR: "4326",
          spatialRel: "esriSpatialRelIntersects",
          outFields: "OBJECTID,BRIGHTNESS,FRP,CONFIDENCE,ACQ_DATE,HOURS_OLD",
          returnGeometry: "true",
          outSR: "4326",
          f: "geojson",
        });

        const response = await fetch(
          `https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/MODIS_Thermal_v1/FeatureServer/0/query?${params.toString()}`,
        );

        if (!response.ok) return;

        const data = await response.json() as {
          features?: Array<{
            id?: number;
            geometry?: { coordinates?: [number, number] };
            properties?: {
              OBJECTID?: number;
              BRIGHTNESS?: number;
              FRP?: number;
              CONFIDENCE?: number;
              ACQ_DATE?: number;
              HOURS_OLD?: number;
            };
          }>;
        };

        const hotspots = (data.features ?? []).flatMap((feature) => {
          const coords = feature.geometry?.coordinates;
          const props = feature.properties;

          if (!coords || !props) return [];

          return [{
            id: feature.id ?? props.OBJECTID ?? Math.random(),
            lat: coords[1],
            lon: coords[0],
            brightness: props.BRIGHTNESS ?? 0,
            confidence: props.CONFIDENCE ?? 0,
            frp: props.FRP ?? 0,
            hoursOld: props.HOURS_OLD ?? 0,
            acquiredAt: props.ACQ_DATE ? new Date(props.ACQ_DATE).toISOString() : "",
          }];
        });

        if (!cancelled) {
          setFireHotspots(hotspots);
        }
      } catch {
        if (!cancelled) {
          setFireHotspots([]);
        }
      }
    }

    void loadFireHotspots();

    return () => {
      cancelled = true;
    };
  }, []);

  function openAsset(assetId: string) {
    setSelectedAssetId(assetId);
    setShowDeviceSidebar(true);
  }

  function toggleLayer(key: keyof LayerState) {
    setLayerState((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function addDrawPoint(point: { lat: number; lon: number }) {
    setDrawPoints((current) => [...current, point]);
  }

  function cancelDrawing() {
    setDrawMode(false);
    setDrawPoints([]);
  }

  function finishGeofence() {
    if (drawPoints.length < 3) return;

    const nextId = `drawn-geofence-${drawnGeofences.length + 1}`;

    setDrawnGeofences((current) => [
      ...current,
      {
        id: nextId,
        name: `Geofence ${current.length + 1}`,
        polygon: drawPoints,
      },
    ]);
    setDrawMode(false);
    setDrawPoints([]);
  }

  return (
    <section className={styles.stage} aria-label="Operational map stage">
      <MapContainer
        attributionControl={false}
        center={center}
        className={styles.map}
        scrollWheelZoom
        zoom={11}
        zoomControl={false}
      >
        <MapDrawingCapture enabled={drawMode} onAddPoint={addDrawPoint} />

        {basemapMode === "map" ? (
          <TileLayer
            attribution="&copy; Esri, DeLorme, NAVTEQ"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <>
            <TileLayer
              attribution="&copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              attribution="&copy; Esri"
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />
          </>
        )}

        {layerState.geofences ? (
          <>
            {layers.map((layer) => (
              <Polygon
                key={layer.id}
                pathOptions={{
                  color: layer.layerType === "zone" ? "#c68a1d" : "#3fb6ff",
                  fillColor: layer.layerType === "zone" ? "#c68a1d" : "#3fb6ff",
                  fillOpacity: layer.layerType === "zone" ? 0.16 : 0.05,
                  weight: 1.4,
                  dashArray: layer.layerType === "corridor" ? "6 6" : "3 5",
                }}
                positions={layerPositions(layer)}
              >
                {layerState.labels ? (
                  <Tooltip className={styles.mapTooltip} direction="top" permanent>
                    {layer.name}
                  </Tooltip>
                ) : null}
              </Polygon>
            ))}
            {drawnGeofences.map((geofence) => (
              <Polygon
                key={geofence.id}
                pathOptions={{
                  color: "#48a7ff",
                  fillColor: "#48a7ff",
                  fillOpacity: 0.08,
                  weight: 1.6,
                  dashArray: "8 6",
                }}
                positions={geofence.polygon.map(({ lat, lon }) => [lat, lon])}
              >
                {layerState.labels ? (
                  <Tooltip className={styles.mapTooltip} direction="top" permanent>
                    {geofence.name}
                  </Tooltip>
                ) : null}
              </Polygon>
            ))}
            {drawMode && drawPoints.length >= 2 ? (
              <Polyline
                pathOptions={{ color: "#48a7ff", dashArray: "8 6", opacity: 0.95, weight: 2 }}
                positions={drawPoints.map(({ lat, lon }) => [lat, lon])}
              />
            ) : null}
            {drawMode ? drawPoints.map((point, index) => (
              <LeafletCircleMarker
                key={`draw-point-${index}`}
                center={[point.lat, point.lon]}
                pathOptions={{
                  color: "#7ad6ff",
                  fillColor: "#7ad6ff",
                  fillOpacity: 1,
                  weight: 1,
                }}
                radius={4}
              />
            )) : null}
          </>
        ) : null}

        {layerState.routes && routePath.length > 1 ? (
          <Polyline
            pathOptions={{ color: "#53c0ff", dashArray: "6 8", opacity: 0.8, weight: 2 }}
            positions={routePath}
          />
        ) : null}

        {layerState.incidents ? incidentSignals.map((signal) => (
          <Fragment key={signal.id}>
            <LeafletCircle
              center={[signal.zoneLat, signal.zoneLon]}
              pathOptions={{
                color: alertColor(signal.severity),
                fillColor: alertColor(signal.severity),
                fillOpacity: 0.14,
                opacity: 0.9,
              }}
              radius={900}
            >
              <Tooltip className={styles.mapTooltip} direction="top">
                {signal.title}
              </Tooltip>
            </LeafletCircle>
            <Marker
              icon={incidentIcon(signal.severity)}
              position={[signal.anchorLat, signal.anchorLon]}
            >
              <Tooltip className={styles.mapTooltip} direction="top" permanent>
                {signal.title}
              </Tooltip>
            </Marker>
          </Fragment>
        )) : null}

        {layerState.heatZones ? fireHotspots.map((hotspot) => (
          <LeafletCircleMarker
            key={hotspot.id}
            center={[hotspot.lat, hotspot.lon]}
            pathOptions={{
              color: hotspot.confidence >= 80 ? "#ff6b3d" : "#ffb347",
              fillColor: hotspot.confidence >= 80 ? "#ff6b3d" : "#ffb347",
              fillOpacity: 0.9,
              weight: 1,
            }}
            radius={Math.max(5, Math.min(10, 4 + (hotspot.frp / 25)))}
          >
            <Tooltip className={styles.mapTooltip} direction="top">
              BCN/NASA hotspot {hotspot.confidence}% · {hotspot.hoursOld}h
            </Tooltip>
          </LeafletCircleMarker>
        )) : null}

        {visibleAssets.map((asset) => (
          <Marker
            key={asset.id}
            eventHandlers={{
              click: () => {
                setSelectedAssetId(asset.id);
              },
            }}
            icon={assetIcon(asset)}
            position={[asset.position.lat, asset.position.lon]}
          />
        ))}
      </MapContainer>

      <div className={styles.controlDock}>
        <div className={styles.quickDock}>
          <button
            className={`${styles.surfaceButton} ${showDeviceSidebar ? styles.surfaceButtonActive : ""}`}
            onClick={() => setShowDeviceSidebar((current) => !current)}
            type="button"
          >
            Devices
          </button>
          <button
            className={`${styles.surfaceButton} ${showLayerPanel ? styles.surfaceButtonActive : ""}`}
            onClick={() => setShowLayerPanel((current) => !current)}
            type="button"
          >
            Layers
          </button>
          {selectedAsset ? (
            <button className={styles.surfaceGhost} onClick={() => setSelectedAssetId("")} type="button">
              Clear focus
            </button>
          ) : null}
        </div>

        {showLayerPanel ? (
          <section className={styles.layerSelector}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelLabel}>Map layers</span>
                <h2 className={styles.panelTitle}>Selector</h2>
              </div>
              <button className={styles.closeButton} onClick={() => setShowLayerPanel(false)} type="button">
                Close
              </button>
            </div>

            <div className={styles.basemapSection}>
              <span className={styles.basemapLabel}>Basemap</span>
              <div className={styles.basemapSwitch}>
                <button
                  className={`${styles.basemapButton} ${basemapMode === "map" ? styles.basemapButtonActive : ""}`}
                  onClick={() => setBasemapMode("map")}
                  type="button"
                >
                  Map
                </button>
                <button
                  className={`${styles.basemapButton} ${basemapMode === "satellite" ? styles.basemapButtonActive : ""}`}
                  onClick={() => setBasemapMode("satellite")}
                  type="button"
                >
                  Satellite
                </button>
              </div>
            </div>

            <div className={styles.drawSection}>
              <span className={styles.basemapLabel}>Geofence drawing</span>
              <div className={styles.drawActions}>
                <button
                  className={`${styles.basemapButton} ${drawMode ? styles.basemapButtonActive : ""}`}
                  onClick={() => {
                    setDrawMode(true);
                    setDrawPoints([]);
                  }}
                  type="button"
                >
                  Draw geofence
                </button>
                {drawMode ? (
                  <>
                    <button
                      className={styles.basemapButton}
                      disabled={drawPoints.length < 3}
                      onClick={finishGeofence}
                      type="button"
                    >
                      Finish
                    </button>
                    <button className={styles.basemapButton} onClick={cancelDrawing} type="button">
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
              {drawMode ? (
                <p className={styles.layerHint}>
                  Click on the map to add vertices. Finish after at least 3 points.
                </p>
              ) : null}
            </div>

            <div className={styles.layerList}>
              {[
                ["airTraffic", "Air traffic", `${assets.filter((asset) => asset.assetType === "air").length} tracks`],
                ["groundTraffic", "Ground traffic", `${assets.filter((asset) => asset.assetType !== "air").length} units`],
                ["incidents", "Incidents & alerts", `${incidentSignals.length} local signals`],
                ["routes", "Routes & waypoints", `${routePath.length} waypoints`],
                ["geofences", "Geofences", `${layers.length + drawnGeofences.length} zones`],
                ["heatZones", "Fire hotspots", `${fireHotspots.length} BCN/NASA points`],
                ["labels", "Labels", "map annotations"],
              ].map(([key, title, meta]) => {
                const layerKey = key as keyof LayerState;

                return (
                  <label key={layerKey} className={styles.layerRow}>
                    <span className={styles.layerText}>
                      <strong>{title}</strong>
                      <span>{meta}</span>
                    </span>
                    <input
                      checked={layerState[layerKey]}
                      className={styles.toggle}
                      onChange={() => toggleLayer(layerKey)}
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>

            <p className={styles.layerHint}>
              Fire hotspot feed based on BCN public dashboard webmap and NASA MODIS thermal detections.
            </p>
          </section>
        ) : null}
      </div>

      {showDeviceSidebar ? (
        <aside className={styles.deviceSidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <span className={styles.panelLabel}>Devices</span>
              <h2 className={styles.sidebarTitle}>Operational assets</h2>
            </div>
            <button className={styles.closeButton} onClick={() => setShowDeviceSidebar(false)} type="button">
              Close
            </button>
          </div>

          <div className={styles.searchShell}>
            <input
              className={styles.searchInput}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search devices..."
              value={searchQuery}
            />
            <button className={styles.filterButton} type="button">
              {filteredAssets.length}
            </button>
          </div>

          <div className={styles.deviceTabs}>
            <button
              className={`${styles.deviceTab} ${deviceFilter === "all" ? styles.deviceTabActive : ""}`}
              onClick={() => setDeviceFilter("all")}
              type="button"
            >
              All {assets.length}
            </button>
            <button
              className={`${styles.deviceTab} ${deviceFilter === "air" ? styles.deviceTabActive : ""}`}
              onClick={() => setDeviceFilter("air")}
              type="button"
            >
              Air {assets.filter((asset) => asset.assetType === "air").length}
            </button>
            <button
              className={`${styles.deviceTab} ${deviceFilter === "ground" ? styles.deviceTabActive : ""}`}
              onClick={() => setDeviceFilter("ground")}
              type="button"
            >
              Ground {assets.filter((asset) => asset.assetType === "ground").length}
            </button>
            <button
              className={`${styles.deviceTab} ${deviceFilter === "personnel" ? styles.deviceTabActive : ""}`}
              onClick={() => setDeviceFilter("personnel")}
              type="button"
            >
              Personnel {assets.filter((asset) => asset.assetType === "personnel").length}
            </button>
          </div>

          <div className={styles.deviceList}>
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                className={`${styles.deviceRow} ${asset.id === selectedAsset?.id ? styles.deviceRowActive : ""}`}
                onClick={() => openAsset(asset.id)}
                type="button"
              >
                <div className={styles.deviceRowTop}>
                  <span className={styles.deviceDot} style={{ "--dot-color": statusColor(asset.status) } as CSSProperties} />
                  <strong>{asset.callsign}</strong>
                  <span className={styles.deviceType}>{asset.assetType}</span>
                </div>
                <p className={styles.deviceMeta}>{asset.name}</p>
                <p className={styles.deviceTelemetry}>
                  ALT {asset.position.altM ?? 0} m &nbsp; SPD {asset.position.speedMps ?? 0} km/h &nbsp; HDG {asset.position.headingDeg ?? 0}°
                </p>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      {selectedAsset ? (
        <aside className={styles.infoSidebar}>
          <div className={styles.infoHeader}>
            <div>
              <span className={styles.panelLabel}>{selectedAsset.callsign}</span>
              <h2 className={styles.sidebarTitle}>{selectedAsset.name}</h2>
            </div>
            <div className={styles.infoActions}>
              <span className={styles.statusBadge}>{selectedAsset.status}</span>
              <button className={styles.closeButton} onClick={() => setSelectedAssetId("")} type="button">
                Close
              </button>
            </div>
          </div>

          <div className={styles.heroPanel}>
            <div className={styles.heroSketch} />
            <div className={styles.heroMetrics}>
              <div>
                <span>Battery</span>
                <strong>{formatPercent(selectedAsset.batteryPct)}</strong>
              </div>
              <div>
                <span>Link</span>
                <strong>{formatPercent(selectedAsset.linkQualityPct)}</strong>
              </div>
            </div>
          </div>

          <div className={styles.instrumentGrid}>
            <div className={styles.instrumentCard}>
              <span>Altitude</span>
              <strong>{selectedAsset.position.altM ?? 0} m</strong>
            </div>
            <div className={styles.instrumentCard}>
              <span>Ground speed</span>
              <strong>{selectedAsset.position.speedMps ?? 0} km/h</strong>
            </div>
            <div className={styles.instrumentCard}>
              <span>Heading</span>
              <strong>{selectedAsset.position.headingDeg ?? 0}°</strong>
            </div>
            <div className={styles.instrumentCard}>
              <span>Mission</span>
              <strong>{selectedAsset.mission}</strong>
            </div>
          </div>

          <div className={styles.quickActions}>
            <button className={styles.actionButton} type="button">Center on map</button>
            <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} type="button">Follow</button>
            <button className={styles.actionButton} type="button">Send command</button>
            <button className={`${styles.actionButton} ${styles.actionButtonWarning}`} type="button">Return to base</button>
          </div>

          <div className={styles.infoList}>
            {incidents.map((incident) => (
              <article key={incident.id} className={styles.infoRow}>
                <div className={styles.infoRowTop}>
                  <strong>{incident.title}</strong>
                  <span className={styles.alertBadge}>{incident.status}</span>
                </div>
                <p>{incident.summary}</p>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}
