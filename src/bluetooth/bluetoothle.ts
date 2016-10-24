type Success = (result: any) => void;
type Failure = (err: any) => void;
type Params = {};

export interface BluetoothLE {
  initialize(success: Success, params: Params): any;
  enable(success: Success, error: Failure): any;
  disable(success: Success, error: Failure): any;
  startScan(success: Success, error: Failure, params: Params): any;
  stopScan(success: Success, error: Failure): any;
  retrieveConnected(success: Success, error: Failure, params: Params): any;
  bond(success: Success, error: Failure, params: Params): any;
  unbond(success: Success, error: Failure, params: Params): any;
  connect(success: Success, error: Failure, params: Params): any;
  reconnect(success: Success, error: Failure, params: Params): any;
  disconnect(success: Success, error: Failure, params: Params): any;
  close(success: Success, error: Failure, params: Params): any;
  discover(success: Success, error: Failure, params: Params): any;
  services(success: Success, error: Failure, params: Params): any;
  characteristics(success: Success, error: Failure, params: Params): any;
  descriptors(success: Success, error: Failure, params: Params): any;
  read(success: Success, error: Failure, params: Params): any;
  subscribe(success: Success, error: Failure, params: Params): any;
  unsubscribe(success: Success, error: Failure, params: Params): any;
  write(success: Success, error: Failure, params: Params): any;
  writeQ(success: Success, error: Failure, params: Params): any;
  readDescriptor(success: Success, error: Failure, params: Params): any;
  writeDescriptor(success: Success, error: Failure, params: Params): any;
  rssi(success: Success, error: Failure, params: Params): any;
  mtu(success: Success, error: Failure, params: Params): any;
  requestConnectionPriority(success: Success, error: Failure, params: Params): any;
  isInitialized(success: Success): any;
  isEnabled(success: Success): any;
  isScanning(success: Success): any;
  isBonded(success: Success, error: Failure, params: Params): any;
  wasConnected(success: Success, error: Failure, params: Params): any;
  isConnected(success: Success, error: Failure, params: Params): any;
  isDiscovered(success: Success, error: Failure, params: Params): any;
  hasPermission(success: Success, error: Failure): any;
  requestPermission(success: Success, error: Failure): any;
  isLocationEnabled(success: Success, error: Failure): any;
  requestLocation(success: Success, error: Failure): any;
  initializePeripheral(success: Success, error: Failure, params: Params): any;
  addService(success: Success, error: Failure, params: Params): any;
  removeService(success: Success, error: Failure, params: Params): any;
  removeAllServices(success: Success, error: Failure, params: Params): any;
  startAdvertising(success: Success, error: Failure, params: Params): any;
  stopAdvertising(success: Success, error: Failure, params: Params): any;
  isAdvertising(success: Success, error: Failure, params: Params): any;
  respond(success: Success, error: Failure, params: Params): any;
  notify(success: Success, error: Failure, params: Params): any;
  encodedStringToBytes(string: string): any;
  bytesToEncodedString(bytes: any): string;
  stringToBytes(string: string): any;
  bytesToString(bytes: any): string;
  bytesToHex(bytes: any): any;
  SCAN_MODE_OPPORTUNISTIC: number;
  SCAN_MODE_LOW_POWER: number;
  SCAN_MODE_BALANCED: number;
  SCAN_MODE_LOW_LATENCY: number;
  MATCH_NUM_ONE_ADVERTISEMENT: number;
  MATCH_NUM_FEW_ADVERTISEMENT: number;
  MATCH_NUM_MAX_ADVERTISEMENT: number;
  MATCH_MODE_AGGRESSIVE: number;
  MATCH_MODE_STICKY: number;
  CALLBACK_TYPE_ALL_MATCHES: number;
  CALLBACK_TYPE_FIRST_MATCH: number;
  CALLBACK_TYPE_MATCH_LOST: number;
}

export interface ScanResult {
  rssi: number;
  name: string;
  address: string;
  status: 'scanResult';
  advertisement: any;
}

export interface DiscoverResult {
  status: 'discovered',
  address: string,
  name: string,
  services: any[]
}


export class FakeBluetoothLE {
  onBluetoothStateChanged: Success;

  private later(cb: (...args: any[]) => void, ...args: any[]) {
    return new Promise((resolve) => {
      setTimeout(() => {
        cb.apply(null, args);
        resolve();
      }, 500);
    });
  }

  initialize(success: Success, params: Params) {
    this.onBluetoothStateChanged = success;
    this.later(success, { status: 'disabled' });
  }

  startScan(success: Success, error: Failure, params: Params) {
    let result: ScanResult = {
      rssi: -50,
      name: 'Fake Device',
      address: '',
      status: 'scanResult',
      advertisement: ''
    };
    this.later(success, { status: 'scanStarted' }).then(() => {
      this.later(success, result);
    });
  }

  stopScan(success: Success, error: Failure) {
    this.later(success);
  }

  connect(success: Success, error: Failure, params: Params) {
    this.later(success, { status: 'connected' });
  }

  close(success: Success, error: Failure, params: Params) {
    this.later(success);
  }

  write(success: Success, error: Failure, params: Params) {
    this.later(success);
  }

  discover(success: Success, error: Failure, params: Params) {
    let result: DiscoverResult = {
      status: 'discovered',
      address: '',
      name: 'Fake Device',
      services: [
        // ...
      ]
    }
    this.later(success, result);
  }

  bytesToEncodedString(bytes: any) {
    return bytes;
  }

  stringToBytes(string: string) {
    return string;
  }

  enable(success: Success, error: Failure) {
    this.later(() => {
      this.onBluetoothStateChanged({ status: 'enabled' });
      success({ status: 'enabled' });
    });
  }

  // Note: not all of the possible values are defined here.
  SCAN_MODE_LOW_LATENCY: -1;
  MATCH_NUM_MAX_ADVERTISEMENT: -1;
  MATCH_MODE_AGGRESSIVE: -1;
  CALLBACK_TYPE_ALL_MATCHES: -1;
}