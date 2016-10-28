
import { observable, autorun } from 'mobx';
import { Bluetooth, OnState, FakeBluetooth, Device } from './interface';

export enum BTState {
  Initializing,
  Disabled,
  Idle,
  Scanning,
  Connecting,
  Connected,
  Disconnecting
}

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

    autorun(() => {
      console.log(`BT State: ${BTState[this.state]}`);
    });
  }

  connectToNearestSensor() {
    return this.scanForDeviceWithService(this.SERVICE_UUID).then((info) => {
      return this.connect(info);
    }).then((device) => {
      this.subscribe(device);
    }).catch((err) => {
      console.error(JSON.stringify(err));
    });
  }

  subscribe(device: Device) {
    let readStatus = () => {
      if (!this.device) {
        console.error('no device!!!');
//        setTimeout(readStatus, 1000);
        return;
      }

      this.ble.read(this.device.id, this.SERVICE_UUID, '0000', (buffer: ArrayBuffer) => {
        this.sensorStatus = new (window as any).TextDecoder('utf-8').decode(buffer);

        console.log('Sensor status is:', this.sensorStatus);
        setTimeout(readStatus, 1000);
      }, (err: any) => {
        console.error('Error reading sensor status:', err);
        this.state = BTState.Disconnecting;
        this.ble.disconnect(device.id, () => {
          this.state = BTState.Idle;
        }, () => {
          this.state = BTState.Idle;
        });
        //setTimeout(readStatus, 1000);
      });
    };

    setTimeout(() => {
      readStatus();
    }, 1000);

    // XXX This doesn't work on devices...
    // this.ble.startNotification(device.id, this.SERVICE_UUID, '0000', (buffer: ArrayBuffer) => {
    //   console.log('NEW VALUE:', buffer);
    // }, (err: any) => {
    //   console.error('FAILURE:', err);
    // });
  }

  private scanForDeviceWithService(requiredServiceUuid: string): Promise<Device> {
    if (this.state !== BTState.Idle) {
      throw new Error(`Unable to scan() while in ${BTState[this.state]} state.`);
    }

    return new Promise((resolve, reject) => {
      this.state = BTState.Scanning;
      let stopTimeout = setTimeout(() => {
        console.log('IN TIMEOUT');
        this.ble.stopScan();
        this.state = BTState.Idle;
        reject('no device found');
      }, this.MAX_SCAN_MS);
      console.log('Setting timeout', this.MAX_SCAN_MS, stopTimeout);

      this.ble.startScan([requiredServiceUuid], (device: Device) => {
        console.log('CLEAR TIMEOUT found', stopTimeout);
        clearTimeout(stopTimeout);
        this.ble.stopScan(() => {
          resolve(device);
        }, (err: any) => {
          console.error('Error stopping scan:', err);
          this.state = BTState.Idle;
          reject(err);
        });
      }, (err: any) => {
        console.log('CLEAR TIMEOUT err', stopTimeout, err);
        clearTimeout(stopTimeout);
        this.state = BTState.Idle;
        reject(err);
      });
    });
  }

  private connect(device: Device): Promise<Device> {
    return new Promise((resolve, reject) => {
      this.state = BTState.Connecting;
      this.ble.connect(device.id, (device: Device) => {
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

  write(serviceUuid: string, characteristicUuid: string, value: ArrayBuffer): Promise<{}> {
    // if (value.byteLength === 0) {
    //   return Promise.resolve({});
    // }
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
