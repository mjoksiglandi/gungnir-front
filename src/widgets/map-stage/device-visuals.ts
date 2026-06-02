import type { Asset } from "@/shared/contracts/operational";

type DeviceVisual = {
  iconPath: string;
  label: string;
};

function normalizedAssetText(asset: Asset) {
  return `${asset.callsign} ${asset.name} ${asset.mission}`.toLowerCase();
}

function resolveAirVisual(asset: Asset): DeviceVisual {
  const text = normalizedAssetText(asset);

  if (text.includes("heli") || text.includes("copter")) {
    return {
      iconPath: "/assets/device-icons/air/helicopter.svg",
      label: "Helicopter",
    };
  }

  if (text.includes("wing") || text.includes("v-bat") || text.includes("flying wing")) {
    return {
      iconPath: "/assets/device-icons/air/flying-wing.svg",
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
      iconPath: "/assets/device-icons/air/multirotor.svg",
      label: "Multirotor",
    };
  }

  return {
    iconPath: "/assets/device-icons/air/airplane.svg",
    label: "Airplane",
  };
}

export function getDeviceVisual(asset: Asset): DeviceVisual {
  if (asset.assetType === "air") {
    return resolveAirVisual(asset);
  }

  if (asset.assetType === "ground") {
    return {
      iconPath: "/assets/device-icons/ground/vehicle.svg",
      label: "Ground vehicle",
    };
  }

  if (asset.assetType === "personnel") {
    return {
      iconPath: "/assets/device-icons/personnel/operator.svg",
      label: "Personnel",
    };
  }

  return {
    iconPath: "/assets/device-icons/maritime/boat.svg",
    label: "Maritime",
  };
}
