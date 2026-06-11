"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useDeferredValue, useMemo, useState } from "react";
import type { Asset, Device, Track, TrackHistoryPoint } from "@/types/domain";
import { getDeviceVisual } from "@/widgets/map-stage/device-visuals";
import {
  buildHistoryRecords,
  filterHistoryRecords,
  formatAssetTypeLabel,
  getHistoryDateRange,
  getHistorySummary,
  type HistoryAssetTypeFilter,
} from "./history-helpers";
import styles from "./history-workspace.module.css";

const HistoryMap = dynamic(() => import("./history-map").then((mod) => mod.HistoryMap), {
  ssr: false,
});

const assetTypeFilters: HistoryAssetTypeFilter[] = [
  "all",
  "air",
  "ground",
  "autonomous",
  "personnel",
  "sensor",
];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortTimestamp(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistoryWorkspace({
  assets,
  devices,
  trackHistory,
  tracksCurrent,
}: Readonly<{
  assets: Asset[];
  devices: Device[];
  trackHistory: TrackHistoryPoint[];
  tracksCurrent: Track[];
}>) {
  const dateRange = useMemo(() => getHistoryDateRange(trackHistory), [trackHistory]);
  const [assetType, setAssetType] = useState<HistoryAssetTypeFilter>("all");
  const [fromDate, setFromDate] = useState(dateRange.toDate);
  const [query, setQuery] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [toDate, setToDate] = useState(dateRange.toDate);
  const deferredQuery = useDeferredValue(query);

  const records = useMemo(
    () => buildHistoryRecords(assets, devices, tracksCurrent, trackHistory),
    [assets, devices, trackHistory, tracksCurrent],
  );
  const filteredRecords = useMemo(
    () => filterHistoryRecords(records, {
      assetType,
      fromDate,
      query: deferredQuery,
      toDate,
    }),
    [assetType, deferredQuery, fromDate, records, toDate],
  );
  const summary = useMemo(() => getHistorySummary(filteredRecords), [filteredRecords]);
  const effectiveSelectedDeviceId = filteredRecords.some((record) => record.deviceId === selectedDeviceId)
    ? selectedDeviceId
    : (filteredRecords[0]?.deviceId ?? "");
  const selectedRecord = filteredRecords.find((record) => record.deviceId === effectiveSelectedDeviceId) ?? null;

  return (
    <section className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Replay / Históricos</p>
          <h1 className={styles.title}>Rutas guardadas por fecha</h1>
          <p className={styles.copy}>
            Filtra por tipo de dispositivo, rango de fechas y búsqueda por nombre o callsign para reconstruir la ruta seguida.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span>Dispositivos</span>
            <strong>{summary.deviceCount}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Puntos</span>
            <strong>{summary.pointCount}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Ventana</span>
            <strong>{fromDate || "--"} - {toDate || "--"}</strong>
          </article>
        </div>
      </header>

      <section className={styles.filters}>
        <label className={styles.field}>
          <span>Buscar</span>
          <input
            className={styles.input}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o callsign"
            type="search"
            value={query}
          />
        </label>

        <label className={styles.field}>
          <span>Desde</span>
          <input
            className={styles.input}
            max={toDate || undefined}
            min={dateRange.fromDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            type="date"
            value={fromDate}
          />
        </label>

        <label className={styles.field}>
          <span>Hasta</span>
          <input
            className={styles.input}
            max={dateRange.toDate || undefined}
            min={fromDate || dateRange.fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            type="date"
            value={toDate}
          />
        </label>

        <fieldset className={styles.typeFilterGroup}>
          <legend>Tipo</legend>
          <div className={styles.typeFilterRail}>
            {assetTypeFilters.map((filter) => (
              <button
                key={filter}
                className={`${styles.typeFilter} ${assetType === filter ? styles.typeFilterActive : ""}`}
                onClick={() => setAssetType(filter)}
                type="button"
              >
                {formatAssetTypeLabel(filter)}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <strong>Resultados</strong>
            <span>{filteredRecords.length} rutas con historial</span>
          </div>

          <div className={styles.resultList}>
            {filteredRecords.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>Sin tracks en este filtro</strong>
                <p>Ajusta fecha, tipo o búsqueda para recuperar recorridos guardados.</p>
              </div>
            ) : filteredRecords.map((record) => {
              const visual = getDeviceVisual(record.asset);

              return (
                <button
                  key={record.deviceId}
                  className={`${styles.resultRow} ${selectedRecord?.deviceId === record.deviceId ? styles.resultRowActive : ""}`}
                  onClick={() => setSelectedDeviceId(record.deviceId)}
                  type="button"
                >
                  <div className={styles.resultIconFrame}>
                    <Image
                      alt={visual.label}
                      className={styles.resultIcon}
                      height={26}
                      src={visual.iconPath}
                      width={26}
                    />
                  </div>

                  <div className={styles.resultContent}>
                    <div className={styles.resultTop}>
                      <strong>{record.asset.callsign}</strong>
                      <span>{formatShortTimestamp(record.lastPoint.timestamp)}</span>
                    </div>
                    <span className={styles.resultName}>{record.asset.name}</span>
                    <span className={styles.resultMeta}>
                      {formatAssetTypeLabel(record.asset.assetType)} · {record.filteredPoints.length} puntos
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className={styles.mapPanel}>
          <div className={styles.mapCard}>
            <HistoryMap
              asset={selectedRecord?.asset ?? null}
              points={selectedRecord?.filteredPoints ?? []}
            />
          </div>

          <section className={styles.detailPanel}>
            {selectedRecord ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <p className={styles.eyebrow}>Unidad seleccionada</p>
                    <h2>{selectedRecord.asset.callsign}</h2>
                    <p className={styles.copy}>
                      {selectedRecord.asset.name} · {selectedRecord.device?.deviceType ?? "device"} · {selectedRecord.deviceId}
                    </p>
                  </div>
                  <div className={styles.detailStats}>
                    <span>{selectedRecord.filteredPoints.length} puntos</span>
                    <span>{formatTimestamp(selectedRecord.filteredPoints[0].timestamp)}</span>
                    <span>{formatTimestamp(selectedRecord.lastPoint.timestamp)}</span>
                  </div>
                </div>

                <div className={styles.timeline}>
                  {selectedRecord.filteredPoints.map((point) => (
                    <article key={point.id} className={styles.timelineRow}>
                      <span className={styles.timelineTime}>{formatTimestamp(point.timestamp)}</span>
                      <div className={styles.timelineDot} aria-hidden="true" />
                      <div className={styles.timelineBody}>
                        <strong>
                          {point.position.lat.toFixed(5)}, {point.position.lon.toFixed(5)}
                        </strong>
                        <span>
                          {typeof point.position.headingDeg === "number" ? `Rumbo ${Math.round(point.position.headingDeg)}°` : "Sin rumbo"}
                          {" · "}
                          {typeof point.position.speedMps === "number" ? `${Math.round(point.position.speedMps * 3.6)} km/h` : "Velocidad n/d"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <strong>Selecciona una unidad</strong>
                <p>Cuando exista historial para el filtro actual, la ruta aparecerá aquí junto a su secuencia temporal.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </section>
  );
}
