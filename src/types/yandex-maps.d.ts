/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    ymaps: {
      ready: (callback: () => void) => void;
      Map: new (container: HTMLElement, state: {
        center: [number, number];
        zoom: number;
        controls?: string[];
      }) => {
        geoObjects: {
          add: (placemark: any) => void;
        };
      };
      Placemark: new (
        geometry: [number, number],
        properties?: {
          balloonContent?: string;
          hintContent?: string;
        },
        options?: {
          preset?: string;
        }
      ) => any;
    };
  }
}

export {}
