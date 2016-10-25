
import { observable, autorun } from 'mobx';

export enum BTState {
  Initializing,
  Disabled,
  Idle,
  Scanning,
  Connecting,
  Connected,
  Closing
}


interface Device {
  name: string;
  id: string;
  rssi: number;
  advertising: any;
  services?: string[];
  characteristics?: any[];
}

// if (!(window as any).cordova) {
//   (window as any).bluetoothle = new FakeBluetoothLE();
// }

export class BluetoothManager {
  @observable state = BTState.Initializing;
  @observable device: Device | undefined;

  ble: any;

  private isAndroid: boolean;

  MAX_SCAN_SECONDS = 15;
  REQUIRED_SIGNAL_STRENGTH = -150;
  SERVICE_UUID = '0123';

  constructor(ble: any, isAndroid: boolean) {
    this.ble = ble;
    this.isAndroid = isAndroid;

    console.log('Bluetooth initializing...');

    this.ble.isEnabled(() => {
      this.state = BTState.Idle;
    }, () => {
      this.state = BTState.Disabled;
    });

    this.ble.startStateNotifications((state: string) => {
      // There are other states; TODO: handle unsupported/unauthorized states
      if (state === 'off' && this.state !== BTState.Disabled) {
        this.state = BTState.Disabled;
        this.device = undefined;
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
        setTimeout(readStatus, 1000);
        return;
      }
      this.ble.read(this.device.id, this.SERVICE_UUID, '0000', (buffer: ArrayBuffer) => {
        let ints = new Uint8Array(buffer);
        console.log('Sensor status is:', ints[0]);
        setTimeout(readStatus, 1000);
      }, (err: any) => {
        console.error('Error reading sensor status:', err);
        setTimeout(readStatus, 1000);
      });
    };

    readStatus();

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
      this.ble.scan([requiredServiceUuid], this.MAX_SCAN_SECONDS, (device: Device) => {
        resolve(device);
      }, (err: any) => {
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
        reject(err);
      });
    });
  }

  write(serviceUuid: string, characteristicUuid: string, value: Uint8Array): Promise<{}> {
    if (value.length === 0) {
      return Promise.resolve({});
    }
    return new Promise((resolve, reject) => {
      if (!this.device) {
        reject('not connected');
        return;
      }
      console.log(`WRITE: ${characteristicUuid} ${value}`);
      this.ble.write(this.device.id, serviceUuid, characteristicUuid, value.buffer, () => {
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
      this.ble.enable(resolve, reject);
    });
  }
}
