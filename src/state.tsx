import { observable, autorun } from 'mobx';
import { Step, NavigationState } from './ui';
import { BluetoothManager, BTState } from './bluetooth';

export class DeviceInfo {
  constructor() {
    const device: any = (window as any).device || { platform: 'Web', version: '' };
    this.platform = device.platform;
    this.version = device.version;
  }
  platform: 'Android' | 'Web'; // "Android" // XXX: what is iOS?
  version: string; // "5.1.1"
}

export class AppState {
  deviceInfo: DeviceInfo;
  nav: NavigationState;
  bluetoothManager: BluetoothManager;

  @observable location: google.maps.LatLng;
  @observable direction?: number;
  @observable floor?: number;
  @observable ssid?: string;
  @observable password?: string;

  constructor() {
    this.deviceInfo = new DeviceInfo();
    this.nav = new NavigationState();
    this.bluetoothManager = new BluetoothManager((window as any).bluetoothle, this.deviceInfo.platform === 'Android' );

    autorun(() => {
      const btState = this.bluetoothManager.state;
      this.nav.mark(
        Step.EnableBluetooth,
        btState !== BTState.Disabled && btState !== BTState.Initializing);
    });
  }
}


