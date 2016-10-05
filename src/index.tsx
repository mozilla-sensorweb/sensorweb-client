import 'babel-polyfill';

import injectTapEventPlugin from 'react-tap-event-plugin';
// Needed for onTouchTap 
// http://stackoverflow.com/a/34015469/988941 
injectTapEventPlugin();

import React from 'react';
import ReactDOM from 'react-dom';
import { observable, autorun } from 'mobx';
import { observer } from 'mobx-react';

import { Page, PageSpinner } from './ui';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';


let WelcomePage = (props: { onWelcomed: () => any }) => (
  <Page>
    <h1>Welcome!</h1>
    <p>Some exciting text here! That's short and fun.</p>
    <button onClick={props.onWelcomed}>Get Started</button>
    <p>Already have a sensor that's setup? Move your device closer to the sensor to
       have it reconnect to your phone.</p>
    <p></p>
    <p>Don't have a sensor? Join in the fun now! And probably a few more lines of copy talking about
    SensorWeb and its awesomeness.</p>
    <button className="secondary">Buy a Sensor Now</button>
    <p>Copy about the app being for connecting with a sensor. If you want the data, please visit
      &nbsp;<a href="#">https://sensorweb.com/</a>.</p>
  </Page>
);

import { BluetoothManager, BTState } from './bluetooth';
import { WifiSetupFlow } from './wifi';
import './assets/normalize.css';
import './assets/fonts/Fira-4.202/fira.css';
import './assets/ui.css'; 
import './assets/index.css';
import 'file?name=[name].[ext]!./index.html';



class AppState {
  @observable language = 'en_US';

  @observable welcomeConfirmed = false;
  @observable bluetoothEnabled = false;
  @observable sensorInRange = false;
  @observable wifiConnected = false;

  deviceVersion = '';
  isAndroid = false;
  isBrowser = false;
  bluetoothManager: BluetoothManager;

  loadDeviceInfo() {
    let device = (window as any).device;
    if (!device) {
      this.isBrowser = true;
      return;
    }

    //  {"available":true,
    // "platform":"Android","version":"5.1.1","uuid":"e4655f1b1ab49bc6","cordova":"5.2.2","model":"Nexus 4","manufacturer":"LGE","isVirtual":false,"serial":"0179277213545921"}"

    this.isAndroid = (device.platform === 'Android');

    this.deviceVersion = device.version;
    console.log(`Device Version: ${JSON.stringify(device)}`);
  }

  constructor() {   
    this.loadDeviceInfo();
    console.log("WAT" + this.isAndroid);
    this.bluetoothManager = new BluetoothManager((window as any).bluetoothle, this.isAndroid);    

    let previousState = this.bluetoothManager.state;
    autorun(() => {
      let state = this.bluetoothManager.state;
      this.sensorInRange = (state === BTState.Discovered);
      this.bluetoothEnabled = (this.bluetoothManager.state !== BTState.Disabled &&
                               this.bluetoothManager.state !== BTState.Initializing);
    });
  }
}

interface EnableBluetoothPageProps {
  bluetoothManager: BluetoothManager
}

@observer
class EnableBluetoothPage extends React.Component<EnableBluetoothPageProps, {}> {
  enableBluetooth() {
    this.props.bluetoothManager.enable();
  }

  render() {
    return <Page>
      <h1>Enable Bluetooth</h1>
      <p>Please enable bluetooth to continue.</p>
      <button onClick={() => this.enableBluetooth()}>Enable Bluetooth</button>
    </Page>;
  }
}

interface FindingSensorPageProps {
  bluetoothManager: BluetoothManager
}

@observer
class FindingSensorPage extends React.Component<FindingSensorPageProps, {}> {
  constructor(props: FindingSensorPageProps) {
    super(props);
    setTimeout(() => {
      this.props.bluetoothManager.connectToNearestSensor();
    }, 1500);
  }

  componentWillUnmount() {
    // XXX: We want to avoid scanning indefinitely, but this thing should probably be onscreen when scanning
    // this.props.bluetoothManager.stopScanning();
  }

  render() {
    return <Page>
      <h1>Finding Sensor</h1>
      <p>Move your phone close to the sensor.</p>
      <p>State: {BTState[this.props.bluetoothManager.state]}</p>
      <PageSpinner />
    </Page>
  }
}

interface RootProps {
  uiState: AppState
}

@observer
class Root extends React.Component<RootProps, {}> {
  constructor(props: RootProps) {
    super(props);
  }

  onWifiConnected(ssidString: string, passwordString: string) {
    let bluetoothManager = this.props.uiState.bluetoothManager;
    if (bluetoothManager.connectedDeviceInfo === null) {
      // XXX THIS IS AN ERROR
      return;
    }
    let ssid: Uint8Array = new (window as any).TextEncoder('utf-8').encode(ssidString);
    let password: Uint8Array = new (window as any).TextEncoder('utf-8').encode(passwordString);
    let deviceInfo = bluetoothManager.connectedDeviceInfo;
    bluetoothManager.write(deviceInfo, 'ec00', 'ffe1', ssid.slice(0, 20))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'ffe2', ssid.slice(20, 40)))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'ffe3', new (window as any).TextEncoder('utf-8').encode(ssid.byteLength.toString())))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'fff1', password.slice(0, 20)))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'fff2', password.slice(20, 40)))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'fff3', password.slice(40, 60)))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'fff4', password.slice(60, 80)))
    .then(() => bluetoothManager.write(deviceInfo, 'ec00', 'fff5', new (window as any).TextEncoder('utf-8').encode(password.length.toString()))).then(() => {
      console.log('WROTE!');
      this.props.uiState.wifiConnected = true;
    }, (err:any) => {
      console.error('ERROR: ' + JSON.stringify(err));
    })
    //console.log('Connected to Wifi!');
    //
  }

  render() {
    let state = this.props.uiState;
    let page: any;

    if (!state.welcomeConfirmed) {
      page = <WelcomePage key="WelcomePage" onWelcomed={() => { state.welcomeConfirmed = true; }} />;
    } else if (!state.bluetoothEnabled) {
      page = <EnableBluetoothPage key="EnableBluetoothPage" bluetoothManager={state.bluetoothManager} />;
    } else if (!state.sensorInRange) {
      page = <FindingSensorPage key="FindingSensorPage" bluetoothManager={state.bluetoothManager} />;
    } else if (!state.wifiConnected) {
      page = <WifiSetupFlow key="WifiSetupFlow" onConnected={this.onWifiConnected.bind(this)} />;
    } else {
      page = <Page><h1>Wifi Done!</h1></Page>;
    }
    
    return (
      <ReactCSSTransitionGroup
          transitionName="next-page"
          transitionEnterTimeout={1500}
          transitionLeaveTimeout={1500}>
        {page}
      </ReactCSSTransitionGroup>
    );
  }
}




document.addEventListener('deviceready', () => {
  // We must not construct AppState until after 'deviceready', because
  // certain Cordova APIs are unavailable until after this event fires.
  let appState = new AppState();

  ReactDOM.render(
    <div className="root">
      <Root uiState={appState} />
    </div>,
    document.getElementById('root')
  );
});

if (!(window as any).cordova) {
  document.dispatchEvent(new CustomEvent('deviceready'));
}
