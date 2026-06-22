import type { ReactNode, SVGProps } from "react";
import type { Asset } from "@/shared/contracts/operational";

type DeviceVisual = {
  icon: ReactNode;
  label: string;
};

type DeviceIconProps = SVGProps<SVGSVGElement>;

function AirplaneIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M3.5 13.5 10.6 12l2.4-7.1a1 1 0 0 1 1.9.2l.7 6.1 4.3-.9a1.8 1.8 0 1 1 .7 3.5l-4.3.9 3.1 5.3a1 1 0 0 1-1.5 1.3L12 16.9l-4.3.9a1.8 1.8 0 1 1-.7-3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HelicopterIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M3 7h18M10 7l2-2m0 2 2-2M8 10h8a3 3 0 0 1 3 3v1h-4l-2.2 2.8a2 2 0 0 1-1.6.8H9a2 2 0 0 1-2-2v-1.5A4.5 4.5 0 0 1 11.5 10H8Zm2 7v2m-2 0h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MultirotorIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M8 9.5h8m-4 0v5m-2-3h4M6 7.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm12 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM6 20a1.75 1.75 0 1 0 0-3.5A1.75 1.75 0 0 0 6 20Zm12 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM7.3 7l3 2m6.4-2-3 2m-3.4 6-3 2m9.4-2-3 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FlyingWingIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m4 15 8-6 8 6-3.4 1.4-4.6-2-4.6 2L4 15Z"
        fill="currentColor"
      />
      <path
        d="M12 9V6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function VehicleIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6 16V9.8c0-.5.2-1 .6-1.4l1.7-1.7c.4-.4.9-.7 1.5-.7h4.4c.6 0 1.1.2 1.5.7l1.7 1.7c.4.4.6.9.6 1.4V16M4.5 16h15M8 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PersonnelIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-4 7.5a4 4 0 0 1 8 0M6.5 16.5a2.5 2.5 0 0 0-2.5 2.5m13-2.5a2.5 2.5 0 0 1 2.5 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function BoatIcon(props: DeviceIconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 5v8m0-8 3 3m-3-3-3 3M5 14h14l-1.6 3.4a2 2 0 0 1-1.8 1.1H8.4a2 2 0 0 1-1.8-1.1L5 14Zm-1 5c1 .9 2 1.3 3 1.3s2-.4 3-1.3c1 .9 2 1.3 3 1.3s2-.4 3-1.3c1 .9 2 1.3 3 1.3s2-.4 3-1.3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function normalizedAssetText(asset: Asset) {
  return `${asset.callsign} ${asset.name} ${asset.mission}`.toLowerCase();
}

function buildIcon(IconComponent: (props: DeviceIconProps) => ReactNode) {
  return <IconComponent aria-hidden="true" className="device-inline-icon" />;
}

function resolveAirVisual(asset: Asset): DeviceVisual {
  const text = normalizedAssetText(asset);

  if (text.includes("heli") || text.includes("copter")) {
    return {
      icon: buildIcon(HelicopterIcon),
      label: "Helicopter",
    };
  }

  if (text.includes("wing") || text.includes("v-bat") || text.includes("flying wing")) {
    return {
      icon: buildIcon(FlyingWingIcon),
      label: "Flying wing",
    };
  }

  if (
    text.includes("quad")
    || text.includes("multi")
    || text.includes("rotor")
    || text.includes("drone")
    || text.includes("uav")
  ) {
    return {
      icon: buildIcon(MultirotorIcon),
      label: "Multirotor",
    };
  }

  return {
    icon: buildIcon(AirplaneIcon),
    label: "Airplane",
  };
}

export function getDeviceVisual(asset: Asset): DeviceVisual {
  if (asset.assetType === "air") {
    return resolveAirVisual(asset);
  }

  if (asset.assetType === "ground") {
    return {
      icon: buildIcon(VehicleIcon),
      label: "Ground vehicle",
    };
  }

  if (asset.assetType === "personnel") {
    return {
      icon: buildIcon(PersonnelIcon),
      label: "Personnel",
    };
  }

  return {
    icon: buildIcon(BoatIcon),
    label: "Maritime",
  };
}
