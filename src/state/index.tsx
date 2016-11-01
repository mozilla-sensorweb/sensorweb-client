import { observable, autorun, autorunAsync, untracked } from 'mobx';
import { NavigationState, Step } from './NavigationState';
import { BluetoothManager, BTState } from '../bluetooth';

export { NavigationState, Step };

export class DeviceInfo {
  constructor() {
    const device: any = (window as any).device || { platform: 'Web', version: '' };
    this.platform = device.platform;
    this.version = device.version;
  }
  platform: 'Android' | 'Web'; // "Android" // XXX: what is iOS?
  version: string; // "5.1.1"
}

interface StorageData {
  cachedSensorStatus?: string;
}

export class AppState {
  deviceInfo: DeviceInfo;
  nav: NavigationState;
  bluetoothManager: BluetoothManager;

  @observable location?: google.maps.LatLng;
  @observable heading?: number;
  @observable altitude?: number;
  @observable ssid?: string;
  @observable password?: string;

  // The status of the sensor, when we last contacted it, tells us whether
  // to show the setup flow or the main dashboard.
  @observable cachedSensorStatus?: string;

  constructor(onAppStateLoaded: (appState: AppState) => void) {
    this.deviceInfo = new DeviceInfo();
    this.nav = new NavigationState();
    this.bluetoothManager = new BluetoothManager((window as any).ble, this.deviceInfo.platform === 'Android' );

    autorun(() => {
      const btState = this.bluetoothManager.state;
      untracked(() => {
        this.nav.mark(
          Step.EnableBluetooth,
          btState !== BTState.Disabled && btState !== BTState.Initializing);
      });
    });

    this.loadFromStorage().then((data: StorageData) => {
      console.log('Loaded App State:', JSON.stringify(data));
      this.cachedSensorStatus = data.cachedSensorStatus;

      autorunAsync(() => {
        this.saveToStorage({
          cachedSensorStatus: this.cachedSensorStatus
        });
      }, 300);

      autorun(() => {
        let previousStatus = this.cachedSensorStatus;
        this.cachedSensorStatus = this.bluetoothManager.sensorStatus;
        // XXX: what to do when sensor status then errors out later?
        if (previousStatus !== this.cachedSensorStatus && this.cachedSensorStatus === 'setupComplete') {
          this.nav._currentStep = Step.Dashboard;
        }
      });

      onAppStateLoaded(this);
    });
  }

  saveToStorage(data: StorageData) {
    console.log('Saving Storage:', JSON.stringify(data));
    let NativeStorage = (window as any).NativeStorage;
    if (!NativeStorage) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      NativeStorage.setItem('data', data, resolve, (err: any) => {
        console.error('Unable to store data!', err);
        resolve();
      });
    });
  }

  loadFromStorage() {
    let NativeStorage = (window as any).NativeStorage;
    if (!NativeStorage) {
      return Promise.resolve({});
    }
    return new Promise<StorageData>((resolve) => {
      NativeStorage.getItem('data', (data: any) => {
        resolve(data || {});
      }, (err: any) => {
        console.error('Unable to load stored data!', err);
        resolve({});
      })
    });
  }
}


