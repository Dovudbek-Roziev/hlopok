/// <reference types="vite/client" />

declare module '*.jpg' { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.png' { const src: string; export default src; }
declare module '*.svg' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }

declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraIdOrConstraints: any,
      config: any,
      onSuccess: (decodedText: string) => void,
      onError?: (errorMessage: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    get isRunning(): boolean;
  }
}
