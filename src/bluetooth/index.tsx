
import { observable, autorun } from 'mobx';
import { BluetoothLE, FakeBluetoothLE, ScanResult, DiscoverResult } from './bluetoothle';

type StringStatus = { status: string };

export enum BTState {
  Initializing,
  Disabled,
  Idle,
  StartingScan,
  Scanning,
  StoppingScan,
  DoneScanning,
  Connecting,
  Connected,
  Discovering,
  Discovered,
  Closing
}

if (!(window as any).cordova) {
  (window as any).bluetoothle = new FakeBluetoothLE();
}

// initialize
// scan (if device address is unknown)
// connect
// discover OR services/characteristics/descriptors (iOS)
// read/subscribe/write characteristics AND read/write descriptors
// disconnect
// close
export class BluetoothManager {
  @observable state = BTState.Initializing;
  @observable connectedDeviceInfo?: DiscoverResult | null;

  bluetoothle: BluetoothLE | FakeBluetoothLE;

  private isAndroid: boolean;

  MAX_SCAN_TIME = 15000;
  REQUIRED_SIGNAL_STRENGTH = -150;

  constructor(bluetoothle: BluetoothLE, isAndroid: boolean) {
    this.bluetoothle = bluetoothle;
    this.isAndroid = isAndroid;

    bluetoothle.initialize(this.onBluetoothStateChanged.bind(this), {
      request: false, // If true, immediately prompt them to enable bluetooth
      statusReceiver: true, // Receive status notifications when the state changes
      restoreKey: 'sensorweb' // A 'unique string to identify your app'; use unclear
    });
    console.log('Bluetooth initializing...');

    autorun(() => {
      console.log(`BT State: ${BTState[this.state]}`);
      if (this.connectedDeviceInfo) {
        console.log(`Device: ${JSON.stringify(this.connectedDeviceInfo)}`);
      }
    });
  }

  private onBluetoothStateChanged(state: StringStatus) {
    let oldState = this.state;

    if (state.status === 'enabled' && this.state !== BTState.Idle) {
      this.state = BTState.Idle;
    } else if (state.status === 'disabled' && this.state !== BTState.Disabled) {
      this.state = BTState.Disabled;
      this.connectedDeviceInfo = null;
    }
  }

  connectToNearestSensor() {
    const SERVICE_UUID = '0123';
    return this.scanForDeviceWithService(SERVICE_UUID).then((info) => {
      return this.connect(info);
    }).then((scanResult) => {
      return this.discover(scanResult);
    }).then((discoverResult) => {
      console.log(`Discovery: ${JSON.stringify(discoverResult)}`);
      // return this.write(discoverResult, SERVICE_UUID, CHARACTERISTIC_UUID);
    }).catch((err) => {
      console.error(JSON.stringify(err));
    });
  }

  stopScanning() {
    if (this.state !== BTState.Scanning) {
      throw new Error(`Unable to stopScanning() while in ${BTState[this.state]} state.`);
    }
    this.state = BTState.StoppingScan;
    return new Promise((resolve) => {
      this.bluetoothle.stopScan(() => {
        this.state = BTState.DoneScanning;
        resolve();
      }, (err: any) => {
        console.warn(`Failed to stop scan: ${err} (assuming DoneScanning state)`);
        this.state = BTState.DoneScanning;
        resolve();
      });
    });
  }

  private scanForDeviceWithService(requiredServiceUuid: string): Promise<ScanResult> {
    if (this.state !== BTState.Idle) {
      throw new Error(`Unable to scan() while in ${BTState[this.state]} state.`);
    }
    return new Promise((resolve, reject) => {
      // Abort after MAX_SCAN_TIME milliseconds.
      let timeoutId = setTimeout(() => {
        // this.stopScanning().then(() => {
        //   reject('timeout');
        // });
      }, this.MAX_SCAN_TIME);

      this.state = BTState.StartingScan;
      this.bluetoothle.startScan((result: ScanResult & StringStatus) => {
        console.log('Result? ' + result.rssi);
        if (result.status === 'scanStarted') {
          this.state = BTState.Scanning;
        } else if (result.status === 'scanResult' && result.rssi > this.REQUIRED_SIGNAL_STRENGTH) {
          this.stopScanning().then(() => {
            clearTimeout(timeoutId);
            resolve(result);
          });
        }
      }, (error: any) => {
        this.state = BTState.Idle;
        reject(error);
      }, {
        scanMode: this.bluetoothle.SCAN_MODE_LOW_LATENCY,
        matchMode: this.bluetoothle.MATCH_MODE_AGGRESSIVE,
        matchNum: this.bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
        callbackType: this.bluetoothle.CALLBACK_TYPE_ALL_MATCHES,
        services: [
          requiredServiceUuid
        ]
      });
    });
  }

  private connect(scanResult: ScanResult): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      this.state = BTState.Connecting;
      this.bluetoothle.connect((result: any) => {
        if (result.status === 'connected') {
          // We connected successfully.
          this.state = BTState.Connected;
          resolve(scanResult);
        } else {
          console.warn('Disconnected unexpectedly from device.');
          this.state = BTState.Closing;
          this.connectedDeviceInfo = null;
          this.bluetoothle.close(() => {
            this.state = BTState.Idle;
          }, (err: any) => {
            console.warn('Ignored close() error:', err);
            this.state = BTState.Idle;
          }, { address: scanResult.address });
        }
      }, (err: any) => {
        console.warn('Failed to connect to device.');
        this.state = BTState.Idle;
        reject(err);
      }, {
        address: scanResult.address
      });
    });
  }

  private discover(scanResult: ScanResult): Promise<DiscoverResult> {
    return new Promise((resolve, reject) => {
      this.state = BTState.Discovering;
      this.bluetoothle.discover((result: DiscoverResult) => {
        this.connectedDeviceInfo = result;
        this.state = BTState.Discovered;
        resolve(this.connectedDeviceInfo);
      }, (err: any) => {
        this.state = BTState.Connected;
        reject(err);
      }, {
        address: scanResult.address,
        clearCache: true
      });
    });
  }

  write(serviceUuid: string, characteristicUuid: string, value: Uint8Array): Promise<{}> {
    if (value.length === 0) {
      return Promise.resolve({});
    }
    return new Promise((resolve, reject) => {
      if (!this.connectedDeviceInfo) {
        reject('not connected');
        return;
      }
      console.log(`WRITE: ${characteristicUuid} ${value}`);
      this.bluetoothle.write((result: any) => {
        resolve();
      }, (err: any) => {
        reject(err);
      }, {
        address: this.connectedDeviceInfo.address,
        service: serviceUuid,
        characteristic: characteristicUuid,
        type: '',
        value: this.bluetoothle.bytesToEncodedString(value),
      });
    });
  }

  enable() {
    return new Promise((resolve, reject) => {
      this.bluetoothle.enable(resolve, reject);
    });
  }
}


  // onWifiConnected(ssidString: string, passwordString: string) {
  //   if (this.bluetoothManager.connectedDeviceInfo === null) {
  //     // XXX THIS IS AN ERROR
  //     return;
  //   }
  //   let encoder = new (window as any).TextEncoder('utf-8');
  //   let ssid: Uint8Array = encoder.encode(ssidString);
  //   let password: Uint8Array = encoder.encode(passwordString);
  //   let deviceInfo = this.bluetoothManager.connectedDeviceInfo;
  //   this.bluetoothManager.write(deviceInfo, 'ec00', 'ffe1', ssid.slice(0, 20))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'ffe2', ssid.slice(20, 40)))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'ffe3', encoder.encode(ssid.byteLength.toString())))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'fff1', password.slice(0, 20)))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'fff2', password.slice(20, 40)))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'fff3', password.slice(40, 60)))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'fff4', password.slice(60, 80)))
  //   .then(() => this.bluetoothManager.write(deviceInfo, 'ec00', 'fff5', encoder.encode(password.length.toString()))).then(() => {
  //     console.log('WROTE!');
  //     this.wifiConnected = true;
  //   }, (err:any) => {
  //     console.error('ERROR: ' + JSON.stringify(err));
  //   })
  // }