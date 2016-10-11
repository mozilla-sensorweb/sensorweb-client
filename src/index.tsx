// These imports inject dependencies like CSS and index.html
import 'babel-polyfill';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin(); // Needed for onTouchTap http://stackoverflow.com/a/34015469/988941
import './assets/normalize.css';
import './assets/fonts/Fira-4.202/fira.css';
import './ui/ui.css';
import 'file?name=[name].[ext]!./index.html';

import React from 'react';
import ReactDOM from 'react-dom';
import { observable, autorun, computed, when } from 'mobx';
import { observer, Provider } from 'mobx-react';

import { Step, NavigationState } from './ui';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { BluetoothManager, BTState } from './bluetooth';

import { WelcomePage } from './pages/welcome';
import { AllowLocationPage } from './pages/allowLocation';
import { SelectLocationPage } from './pages/selectLocation';
import { EnableBluetoothPage } from './pages/enableBluetooth';
import { FindingSensorPage } from './pages/findingSensor';
import { CompassPage } from './pages/compass';
import { AltitudePage } from './pages/altitude';
import { WifiCredentialsPage } from './pages/wifi';

import { AppState } from './state';

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
      [Step.AllowLocation]:
      <AllowLocationPage nav={nav} locationState={appState} />,
      [Step.SelectLocation]:
      <SelectLocationPage nav={nav} locationState={appState} />,
      [Step.Compass]:
      <CompassPage nav={nav} location={appState.location} saveCompassDirection={(degrees) => {
        appState.direction = degrees;
      } } />,
      [Step.Altitude]:
      <AltitudePage nav={nav} floor={appState.floor} saveAltitude={(floor) => {
        appState.floor = floor;
      } } />,

      [Step.Wifi]:
      <WifiCredentialsPage nav={nav} onConfirm={(network, password) => {
        console.log('CONFIRM', network, password);
      } } />,

      [Step.EnableBluetooth]:
      <EnableBluetoothPage nav={nav} bluetoothManager={appState.bluetoothManager} />,

      [Step.FindSensor]:
      <FindingSensorPage nav={nav} bluetoothManager={appState.bluetoothManager}
        appState={appState} />,
    };

    return (
      <Provider>
        <ReactCSSTransitionGroup
          transitionName={nav.wentBackwards ? 'previous-page' : 'next-page'}
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1000}>
          <div key={nav.currentStep}>{pages[nav.currentStep]}</div>
        </ReactCSSTransitionGroup>
      </Provider>
    );
  }
}

document.addEventListener('deviceready', () => {
  // We must not construct AppState until after 'deviceready', because
  // certain Cordova APIs are unavailable until after this event fires.
  let appState = new AppState();
  (window as any).appState = appState;


  document.addEventListener('backbutton', () => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      (document.activeElement as HTMLInputElement).blur();
    }
    appState.nav.markPreviousStepIncomplete();
  });


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
