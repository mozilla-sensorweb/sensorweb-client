import 'babel-polyfill';

import injectTapEventPlugin from 'react-tap-event-plugin';
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

import React from 'react';
import ReactDOM from 'react-dom';
import { observable, autorun, computed, when } from 'mobx';
import { observer, Provider } from 'mobx-react';

import { Step, NavigationState } from './ui';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { BluetoothManager, BTState } from './bluetooth';
import './assets/normalize.css';
import './assets/fonts/Fira-4.202/fira.css';
import './ui/ui.css';
import './assets/index.css';
import 'file?name=[name].[ext]!./index.html';

import { WelcomePage } from './pages/welcome';
import { EnableBluetoothPage } from './pages/enableBluetooth';
import { FindingSensorPage } from './pages/findingSensor';

class DeviceInfo {
  constructor() {
    const device: any = (window as any).device || { platform: 'Web', version: ''};
    this.platform = device.platform;
    this.version = device.version;
  }
  platform: 'Android' | 'Web'; // "Android" // XXX: what is iOS?
  version: string; // "5.1.1"
}

class AppState {
  deviceInfo: DeviceInfo;
  nav: NavigationState;
  bluetoothManager: BluetoothManager;

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

interface RootProps {
  appState: AppState;
}

@observer
class Root extends React.Component<RootProps, {}> {
  render() {
    let appState = this.props.appState;
    let nav = this.props.appState.nav;

    let pages = {
      [Step.Welcome]:
      <WelcomePage nav={nav} />,

      [Step.EnableBluetooth]:
      <EnableBluetoothPage nav={nav} bluetoothManager={appState.bluetoothManager} />,

      [Step.FindSensor]:
      <FindingSensorPage nav={nav} bluetoothManager={appState.bluetoothManager} />

      // [Step.Wifi]:
      // <WifiSetupFlow nav={nav} />,

      // [Step.Location]:
      // <AllowLocationPage nav={nav} />,

      // [Step.Compass]:
      // <CompassPage nav={nav} />,
    };

    return (
      <Provider>
        <ReactCSSTransitionGroup
            transitionName={nav.wentBackwards ? 'previous-page' : 'next-page'}
            transitionEnterTimeout={1500}
            transitionLeaveTimeout={1500}>
          <div key={nav.currentStep}>{pages[nav.currentStep]}</div>
        </ReactCSSTransitionGroup>
      </Provider>
    );
  }
}

document.addEventListener('deviceready', () => {
  // We must not construct AppState until after 'deviceready', because
  // certain Cordova APIs are unavailable until after this event fires.
  let nav = new NavigationState();
  let appState = new AppState();

  ReactDOM.render(
    <div className="root">
      <Root appState={appState} />
    </div>,
    document.getElementById('root')
  );
});

if (!(window as any).cordova) {
  document.dispatchEvent(new CustomEvent('deviceready'));
}
