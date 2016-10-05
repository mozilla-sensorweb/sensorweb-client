
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
  Connecting,
  Connected,
  Discovering,
  Discovered
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
  @observable connectedDeviceInfo: DiscoverResult | null;

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

  onBluetoothStateChanged(state: StringStatus) {
    let oldState = this.state;

    if (state.status === 'enabled' && this.state !== BTState.Idle) {
      this.state = BTState.Idle;
    } else if (state.status === 'disabled' && this.state !== BTState.Disabled) {
      this.state = BTState.Disabled;
      this.connectedDeviceInfo = null;
    }
  }

  connectToNearestSensor() {
    const SERVICE_UUID = 'ec00';
    const CHARACTERISTIC_UUID = 'fff1';
    
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
        this.state = BTState.Idle;
        resolve();
      }, (err: any) => {
        console.warn(`Failed to stop scan: ${err} (assuming idle state)`);
        this.state = BTState.Idle;
        resolve();
      });
    });
  }
  
  scanForDeviceWithService(requiredServiceUuid: string): Promise<ScanResult> {
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

  connect(scanResult: ScanResult): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      this.state = BTState.Connecting;
      this.bluetoothle.connect((result: any) => {
        if (result.status === 'connected') {
          // We connected successfully.
          this.state = BTState.Connected;
          resolve(scanResult);
        } else {
          console.warn('Disconnected unexpectedly from device.');
          this.state = BTState.Idle;
          this.connectedDeviceInfo = null;
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

  discover(scanResult: ScanResult): Promise<DiscoverResult> {
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

  write(discoverResult: DiscoverResult, serviceUuid: string, characteristicUuid: string, value: Uint8Array): Promise<{}> {
    if (value.length === 0) {
      return Promise.resolve({});
    }
    return new Promise((resolve, reject) => {
      console.log(`WRITE: ${characteristicUuid} ${value}`);
      this.bluetoothle.write((result: any) => {
        resolve();
      }, (err: any) => {
        reject(err);
      }, {
        address: discoverResult.address,
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
