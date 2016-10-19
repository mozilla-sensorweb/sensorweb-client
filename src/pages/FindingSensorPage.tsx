import React from 'react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { when } from 'mobx';
import { BluetoothManager, BTState } from '../bluetooth';

import { AppState } from '../state';

interface FindingSensorPageProps {
  nav: NavigationState;
  appState: AppState;
  bluetoothManager: BluetoothManager;
}

@observer
export default class FindingSensorPage extends React.Component<FindingSensorPageProps, {}> {
  dispose: any;

  componentWillMount() {
    this.dispose = when('bluetooth discovered',
      () => this.props.bluetoothManager.state === BTState.Discovered,
      () => this.sync());

    setTimeout(() => {
      this.props.bluetoothManager.connectToNearestSensor();
    }, 1000);
  }

  sync() {
    let state = this.props.appState;
    let payload = {
      ssid: state.ssid,
      password: state.password,
      floor: state.floor,
      lat: state.location && state.location.lat(),
      lng: state.location && state.location.lng(),
      direction: state.heading
    };
    console.log('WOULD SEND', payload);
    this.props.nav.markComplete();
  }

  componentWillUnmount() {
    this.dispose();
    // XXX: We want to avoid scanning indefinitely, but this thing should probably be onscreen when scanning
    // this.props.bluetoothManager.stopScanning();
  }

  render() {
    let state = this.props.appState;
    return <Page>
      <PageHeader nav={this.props.nav} title='Finding Sensor' />
      <PageContent>
        {/*<TutorialImage src={require<string>('../assets/finding-sensor.svg')} />*/}
        <section className="instruction">
          <p>SSID: {state.ssid} {state.password}<br/>
            Floor: {state.floor}<br/>

            Direction: {state.heading}</p>
        </section>
        <img className="InlineSpinner" src={require<string>('../assets/spinner.svg')}/>
        <div>
          <p className="instruction">Hold your phone near the sensor.</p>
          <p style={{opacity: 0.1, textAlign: 'center'}}>{BTState[this.props.bluetoothManager.state]}…</p>
        </div>
      </PageContent>
    </Page>;
  }
}