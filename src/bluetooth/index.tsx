
import { observable, autorun, untracked } from 'mobx';
import { Bluetooth, OnState, FakeBluetooth, Device } from './interface';
import { throttle } from 'lodash';

export enum BTState {
  Initializing,
  Disabled,
  Idle,
  Scanning,
  Connecting,
  Connected,
  Disconnecting
}

const UTF8_DECODER = new (window as any).TextDecoder('utf-8');
const STATUS_CHARACTERISTIC = '0000';

export class BluetoothManager {
  @observable state = BTState.Initializing;
  @observable device?: Device;
  @observable sensorStatus?: string;

  ble: Bluetooth;

  private isAndroid: boolean;

  MAX_SCAN_MS = 15000;
  REQUIRED_SIGNAL_STRENGTH = -150;
  SERVICE_UUID = '0123';

  constructor(ble: Bluetooth | undefined, isAndroid: boolean) {
    this.ble = ble || new FakeBluetooth();
    this.isAndroid = isAndroid;

    console.log('Bluetooth initializing...');

    this.ble.isEnabled(() => {
      this.state = BTState.Idle;
    }, () => {
      this.state = BTState.Disabled;
    });

    this.ble.startStateNotifications((state: OnState) => {
      // There are other states; TODO: handle unsupported/unauthorized states
      if (state === 'off' && this.state !== BTState.Disabled) {
        this.state = BTState.Disabled;
        this.device = undefined;
        this.sensorStatus = undefined;
      } else if (state === 'on' && this.state === BTState.Disabled) {
        this.state = BTState.Idle;
      }
    });

    let tryToConnect = throttle(() => {
      console.log('BT: Noticed state was Idle, trying to connect.');
      // XXX this logic is not correct
      if (this.state === BTState.Idle) {
        this.connectToNearestSensor();
      }
    }, 3000);

    autorun(() => {
      console.log(`BT State: ${BTState[this.state]}`);
      untracked(() => {
        if (this.state === BTState.Idle) {
          tryToConnect();
        }
      });
    });

    this.heartbeat();
  }

  async connectToNearestSensor() {
    let device = await this.scanForDeviceWithService(this.SERVICE_UUID);
    await this.connect(device.id);
  }

  async connect(deviceId: string) {
    return new Promise<Device>((resolve, reject) => {
      this.state = BTState.Connecting;
      this.ble.connect(deviceId, (device: Device) => {
        this.state = BTState.Connected;
        this.device = device;
        console.log('Connected to:', JSON.stringify(device));
        resolve(device);
      }, (err: any) => {
        this.device = undefined;
        this.sensorStatus = undefined;
        this.state = BTState.Idle;
        reject(err);
      });
    });
  }

  async heartbeat() {
    try {
      if (!this.device) {
        return;
      }
      let buffer = await this.read(STATUS_CHARACTERISTIC);
      this.sensorStatus = UTF8_DECODER.decode(buffer);
      console.log('Sensor status is:', this.sensorStatus);
    } catch (e) {
      console.error('Heartbeat error:', e);
      this.state = BTState.Disconnecting;
      await this.disconnect();
    } finally {
      setTimeout(this.heartbeat.bind(this), 3000);
    }
  }

  async disconnect() {
    return new Promise((resolve) => {
      if (!this.device) {
        resolve();
        return;
      }
      this.ble.disconnect(this.device.id, resolve, resolve);
    }).then(() => {
      this.state = BTState.Idle;
    });
  }

  async read(characteristicUuid: string) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      if (!this.device) {
        reject('no device connected, cannot read.');
        return;
      }
      this.ble.read(this.device.id, this.SERVICE_UUID, characteristicUuid, (buffer: ArrayBuffer) => {
        resolve(buffer);
      }, (err: any) => {
        reject(err);
      });
    });
  }

  private scanForDeviceWithService(requiredServiceUuid: string): Promise<Device> {
    if (this.state !== BTState.Idle) {
      throw new Error(`Unable to scan() while in ${BTState[this.state]} state.`);
    }

    return new Promise((resolve, reject) => {
      this.state = BTState.Scanning;
      let stopTimeout = setTimeout(() => {
        this.ble.stopScan();
        this.state = BTState.Idle;
        reject('no device found');
      }, this.MAX_SCAN_MS);

      this.ble.startScan([requiredServiceUuid], (device: Device) => {
        clearTimeout(stopTimeout);
        this.ble.stopScan(() => {
          resolve(device);
        }, (err: any) => {
          console.error('Error stopping scan:', err);
          this.state = BTState.Idle;
          reject(err);
        });
      }, (err: any) => {
        clearTimeout(stopTimeout);
        this.state = BTState.Idle;
        reject(err);
      });
    });
  }

  write(serviceUuid: string, characteristicUuid: string, value: ArrayBuffer): Promise<{}> {
    return new Promise((resolve, reject) => {
      if (!this.device) {
        reject('not connected');
        return;
      }
      console.log(`WRITE: ${characteristicUuid} ${value}`);
      console.log(JSON.stringify(this.device));
      this.ble.write(this.device.id, serviceUuid, characteristicUuid, value, () => {
        console.log('Wrote', value);
        resolve();
      }, (err: any) => {
        console.error('Write error:', err);
        reject(err);
      });
    });
  }

  enable() {
    return new Promise((resolve, reject) => {
      if (this.isAndroid) {
        this.ble.enable(resolve, reject);
      } else {
        this.ble.showBluetoothSettings(resolve, reject);
      }
    });
  }
}
