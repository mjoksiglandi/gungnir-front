"use client";

import type { CSSProperties } from "react";
import type { MapLayer } from "@/types/domain";
import type { GeoJsonFeature } from "@/types/api";
import {
  hazardPopupItems,
  hazardPopupTitle,
  mapLayerColor,
  mapLayerMarkerGlyph,
  naturalHazardColor,
  readText,
} from "./map-stage-canvas.helpers";
import styles from "../map-stage.module.css";

export function HazardPopup({
  coordinates,
  feature,
  layer,
}: Readonly<{
  coordinates: [number, number];
  feature: GeoJsonFeature;
  layer: MapLayer;
}>) {
  const color = naturalHazardColor(feature.properties, mapLayerColor(layer));
  const items = hazardPopupItems(layer, feature, coordinates)
    .map(([label, value]) => [String(label), readText(value)] as const)
    .filter(([, value]) => Boolean(value));

  return (
    <div className={styles.hazardPopup} style={{ "--layer-color": color } as CSSProperties}>
      <header className={styles.hazardPopupHeader}>
        <span className={styles.hazardPopupIcon}>{mapLayerMarkerGlyph(layer)}</span>
        <strong>{hazardPopupTitle(layer, feature)}</strong>
      </header>
      <dl className={styles.hazardPopupGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function InfoPopup({
  accentColor,
  items,
  marker,
  title,
}: Readonly<{
  accentColor: string;
  items: Array<readonly [label: string, value: string]>;
  marker: string;
  title: string;
}>) {
  return (
    <div className={styles.infoPopup} style={{ "--layer-color": accentColor } as CSSProperties}>
      <header className={styles.infoPopupHeader}>
        <span className={styles.infoPopupIcon}>{marker}</span>
        <strong>{title}</strong>
      </header>
      <dl className={styles.infoPopupGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
