// These imports inject dependencies like CSS and index.html
import 'babel-polyfill';

import './ui/index.css';
import 'file?name=[name].[ext]!./index.html';

import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';

import { NavigationState, Step } from './state';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import WelcomePage from './pages/WelcomePage';
import BeginSetupPage from './pages/BeginSetupPage';
import AllowLocationPage from './pages/AllowLocationPage';
import SelectLocationPage from './pages/SelectLocationPage';
import EnableBluetoothPage from './pages/EnableBluetoothPage';
import FindingSensorPage from './pages/FindingSensorPage';
import CompassPage from './pages/CompassPage';
import AltitudePage from './pages/AltitudePage';
import WifiCredentialsPage from './pages/WifiCredentialsPage';
import DashboardPage from './pages/DashboardPage';

let FastClick = require<any>('fastclick');

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

      [Step.BeginSetup]:
      <BeginSetupPage nav={nav} />,

      [Step.AllowLocation]:
      <AllowLocationPage nav={nav} />,

      [Step.SelectLocation]:
      <SelectLocationPage nav={nav} location={appState.location} saveLocation={(location) => {
        console.log('SAVED LOC', location.lat(), location.lng());
        appState.location = location;
      } } />,

      [Step.Compass]:
      <CompassPage nav={nav}
        heading={appState.heading}
        location={appState.location as google.maps.LatLng} saveCompassDirection={(degrees) => {
        appState.heading = degrees;
      } } />,

      [Step.Altitude]:
      <AltitudePage nav={nav} altitude={appState.altitude} saveAltitude={(altitude) => {
        appState.altitude = altitude;
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

      [Step.Dashboard]:
      <DashboardPage nav={nav} />,
    };

    return (
      <div className="root">
        <ReactCSSTransitionGroup
          transitionName={nav.wentBackwards ? 'previous-page' : 'next-page'}
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          <div key={nav.currentStep}>{pages[nav.currentStep]}</div>
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

function combineConsoleArguments(method: string) {
  let console: any = window.console;
  let originalMethod = console[method].bind(console);
  console[method] = (...args: any[]) => {
    originalMethod(args.map((arg) => arg + '').join(' '));
  };
}

document.addEventListener('deviceready', () => {
  window.open = (window as any).cordova && (window as any).cordova.InAppBrowser.open;

  // Android doesn't log more than one argument to console.log, despite
  // the existence of cordova-plugin-console. Shim it ourselves, I guess.
  if ((window as any).cordova && (window as any).cordova.platformId === 'android') {
    combineConsoleArguments('info');
    combineConsoleArguments('log');
    combineConsoleArguments('warn');
    combineConsoleArguments('error');
  }

  // We must not construct AppState until after 'deviceready', because
  // certain Cordova APIs are unavailable until after this event fires.
  let appState = new AppState(onAppStateLoaded);
  (window as any).appState = appState;
});

function onAppStateLoaded(appState: AppState) {

  document.addEventListener('backbutton', () => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      (document.activeElement as HTMLInputElement).blur();
    }
    appState.nav.markPreviousStepIncomplete();
  });

  ReactDOM.render(
    <Root appState={appState} />,
    document.getElementById('root')
  );

  FastClick.attach(document.body);
  console.log('Attached FastClick');

  console.log('Hiding splash screen...');
  setTimeout(() => {
    let splashscreen: any = (navigator as any).splashscreen;
    splashscreen && splashscreen.hide();
  }, 500);

  handleSoftwareKeyboardWindowResizing();

  // the ontouchstart allows Safari to show :active states:
  // http://stackoverflow.com/questions/3885018/active-pseudo-class-doesnt-work-in-mobile-safari
  document.body.ontouchstart = () => {};
}


/**
 * Find the <PageContent/> ancestor of document.activeElement.
 */
function findActivePageContent(): HTMLElement | undefined {
  let el = document.activeElement;
  while (el) {
    if (el.classList.contains('PageContent')) {
      return el as HTMLElement;
    }
    el = el.parentElement;
  }
}

/**
 * When the software keyboard pops up, we want the app to behave as close to
 * a native app as possible. With cordova, there are a couple options --
 * we can use the OS-default behavior, which makes the entire webview scrollable
 * and moves the text input onscreen (causing the page header to disappear from the
 * top of the page), or we can call Keyboard.disableScroll(true) and perform our
 * own manual actions. We do the latter.
 */
function handleSoftwareKeyboardWindowResizing() {
  let platformId: string = (window as any).cordova && (window as any).cordova.platformId;
  // Don't resize the webview when the keyboard comes up. This is only available on iOS.
  if (platformId === 'ios') {
    (window as any).cordova.plugins.Keyboard.disableScroll(true);
  }

  let activePageContent: HTMLElement|undefined;

  // When the keyboard shows, figure out if PageContent needs to be scrollable.
  // If there's not much content, the view might not need to change anything.
  // If there is, make PageContent scrollable, and scroll the input into view ourselves.
  window.addEventListener('native.keyboardshow', (e: any) => {
    console.log('native.keyboardshow');
    activePageContent = findActivePageContent();
    if (!activePageContent) {
      return;
    }
    // On iOS, we need to add a margin to the content, because by default the content
    // extends below the keyboard. Android automatically shrinks the viewport.
    if (platformId === 'ios') {
      activePageContent.style.marginBottom = e.keyboardHeight + 'px';
    }
    console.log('scrollHeight', activePageContent,
      activePageContent.scrollHeight, activePageContent.clientHeight);

    if (activePageContent.scrollHeight > activePageContent.clientHeight) {
      document.body.classList.add('content-is-scrollable');
      document.activeElement.scrollIntoView(false /* align to bottom */);
    }
  });
  // Reset everything when the keyboard goes away.
  window.addEventListener('native.keyboardhide', () => {
    console.log('native.keyboardhide');
    document.body.classList.remove('content-is-scrollable');
    if (activePageContent) {
      if (platformId === 'ios') {
        activePageContent.style.marginBottom = '0';
      }
      activePageContent = undefined;
    }
  });
}

if (!(window as any).cordova) {
  document.dispatchEvent(new CustomEvent('deviceready'));
}
