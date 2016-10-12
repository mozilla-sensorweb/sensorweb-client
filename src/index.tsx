// These imports inject dependencies like CSS and index.html
import 'babel-polyfill';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin(); // Needed for onTouchTap http://stackoverflow.com/a/34015469/988941

import './ui/index.css';
import 'file?name=[name].[ext]!./index.html';

import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

import { NavigationState, Step } from './state';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import WelcomePage from './pages/WelcomePage';
import AllowLocationPage from './pages/AllowLocationPage';
import SelectLocationPage from './pages/SelectLocationPage';
import EnableBluetoothPage from './pages/EnableBluetoothPage';
import FindingSensorPage from './pages/FindingSensorPage';
import CompassPage from './pages/CompassPage';
import AltitudePage from './pages/AltitudePage';
import WifiCredentialsPage from './pages/WifiCredentialsPage';

import { AppState } from './state';

interface RootProps {
  appState: AppState;
}

@observer
class Root extends React.Component<RootProps, {}> {
  render() {
    let appState: AppState = this.props.appState;
    let nav: NavigationState = this.props.appState.nav;

    let pages = {

      [Step.Welcome]:
      <WelcomePage nav={nav} />,

      [Step.AllowLocation]:
      <AllowLocationPage nav={nav} saveLocation={(location) => {
        appState.location = location;
      } } />,

      [Step.SelectLocation]:
      <SelectLocationPage nav={nav} location={appState.location} saveLocation={(location) => {
        appState.location = location;
      } } />,

      [Step.Compass]:
      <CompassPage nav={nav} location={appState.location as google.maps.LatLng} saveCompassDirection={(degrees) => {
        appState.direction = degrees;
      } } />,

      [Step.Altitude]:
      <AltitudePage nav={nav} floor={appState.floor} saveAltitude={(floor) => {
        appState.floor = floor;
      } } />,

      [Step.Wifi]:
      <WifiCredentialsPage nav={nav} onConfirm={(ssid, password) => {
        appState.ssid = ssid;
        appState.password = password;
        console.log('CONFIRM', ssid, password);
      } } />,

      [Step.EnableBluetooth]:
      <EnableBluetoothPage nav={nav} bluetoothManager={appState.bluetoothManager} />,

      [Step.FindSensor]:
      <FindingSensorPage nav={nav} bluetoothManager={appState.bluetoothManager}
        appState={appState} />,
    };

    return (
      <ReactCSSTransitionGroup
        transitionName={nav.wentBackwards ? 'previous-page' : 'next-page'}
        transitionEnterTimeout={700}
        transitionLeaveTimeout={700}>
        <div key={nav.currentStep}>{pages[nav.currentStep]}</div>
      </ReactCSSTransitionGroup>
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
      <div id="PageLoader" />
      <Root appState={appState} />
    </div>,
    document.getElementById('root')
  );
});

if (!(window as any).cordova) {
  document.dispatchEvent(new CustomEvent('deviceready'));
}
