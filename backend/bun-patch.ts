import v8 from "node:v8";

if (!v8.startupSnapshot) {
  Object.defineProperty(v8, "startupSnapshot", {
    value: { isBuildingSnapshot: () => false },
    writable: true,
    configurable: true,
  });
}
