export {};

declare global {
  interface Window {
    electronAPI: {
      startScheduler: (data: { breakInterval: number; blinkInterval: number }) => void;
    };
  }
}
