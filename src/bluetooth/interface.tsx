type ErrorFn = (err: any) => void;
type VoidFn = () => void;

export type OnState = 'on' | 'off' | 'turningOn' | 'turningOff' |
  'unknown' | 'resetting' | 'unsupported' | 'unauthorized';

export interface Device {
  name: string;
  id: string;
  rssi: number;
  advertising: any;
  services?: string[];
  characteristics?: any[];
}

// NOTE: The cordova-plugin-ble-central object provides more functions than are listed here.
// These are only the functions we currently use. Both the Cordova Plugin and FakeBluetooth
// must implement the functions listed here.
export interface Bluetooth {
  isEnabled(enabled: VoidFn, disabled: VoidFn): void;
  startStateNotifications(cb: (state: OnState) => void): void;
  disconnect(deviceId: string, success: VoidFn, error: ErrorFn): void;
  startScan(serviceIds: string[], success: (device: Device) => void, error: ErrorFn): void;
  stopScan(success?: VoidFn, error?: ErrorFn): void;
  connect(deviceId: string, success: (device: Device) => void, error: ErrorFn): void;
  enable(success: VoidFn, error: ErrorFn): void;
  showBluetoothSettings(success: VoidFn, error: ErrorFn): void;
  read(deviceId: string, serviceId: string, characteristicId: string,
       success: (buffer: ArrayBuffer) => void, error: ErrorFn): void;
  write(deviceId: string, serviceId: string, characteristicId: string, buffer: ArrayBuffer,
        success: VoidFn, error: ErrorFn): void;
}


let FAKE_DEVICE: Device = {
  name: 'FakeDevice',
  id: '0000',
  rssi: 0,
  advertising: null
};

export class FakeBluetooth {
  isEnabled(enabled: VoidFn, disabled: VoidFn) {
    enabled();
  }

  startStateNotifications(cb: (state: OnState) => void) {
    cb('on');
  }

  disconnect(deviceId: string, success: VoidFn, error: ErrorFn) {
    success();
  }

  startScan(serviceIds: string[], success: (device: Device) => void, error: ErrorFn) {
    success(FAKE_DEVICE);
  }

  stopScan(success?: VoidFn, error?: ErrorFn) {
    success && success();
  }

  connect(deviceId: string, success: (device: Device) => void, error: ErrorFn) {
    success(FAKE_DEVICE);
  }

  enable(success: VoidFn, error: ErrorFn) {
    success();
  }

  showBluetoothSettings(success: VoidFn, error: ErrorFn) {
    success();
  }

  read(deviceId: string, serviceId: string, characteristicId: string,
       success: (buffer: ArrayBuffer) => void, error: ErrorFn) {
    success(new Uint8Array(0).buffer);
  }

  write(deviceId: string, serviceId: string, characteristicId: string, buffer: ArrayBuffer,
        success: VoidFn, error: ErrorFn) {
    success();
  }
}