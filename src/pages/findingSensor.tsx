import React from 'react';
import { Page, NavigationState, PageSpinner } from '../ui';
import { observer } from 'mobx-react';
import { when } from 'mobx';
import { BluetoothManager, BTState } from '../bluetooth';

interface FindingSensorPageProps {
  nav: NavigationState,
  bluetoothManager: BluetoothManager
}

@observer
export class FindingSensorPage extends React.Component<FindingSensorPageProps, {}> {
  dispose: any;

  componentWillMount() {
    this.props.bluetoothManager.connectToNearestSensor();
    this.dispose = when('bluetooth discovered',
      () => this.props.bluetoothManager.state === BTState.Discovered,
      () => this.props.nav.markComplete());
  }

  componentWillUnmount() {
    this.dispose();
    // XXX: We want to avoid scanning indefinitely, but this thing should probably be onscreen when scanning
    // this.props.bluetoothManager.stopScanning();
  }

  render() {
    return <Page nav={this.props.nav}>
      <h1>Finding Sensor</h1>
      <p>Move your phone close to the sensor.</p>
      <p>State: {BTState[this.props.bluetoothManager.state]}</p>
      <PageSpinner />
    </Page>
  }
}