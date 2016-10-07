import React from 'react';
import { Page, NavigationState, TutorialImage } from '../ui';
import { observer } from 'mobx-react';
import { when } from 'mobx';
import { BluetoothManager, BTState } from '../bluetooth';

interface FindingSensorPageProps {
  nav: NavigationState;
  bluetoothManager: BluetoothManager;
}

@observer
export class FindingSensorPage extends React.Component<FindingSensorPageProps, {}> {
  dispose: any;

  componentWillMount() {
    //this.props.bluetoothManager.connectToNearestSensor();
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
    return <Page nav={this.props.nav} next={false} title='Finding Sensor'>
      <TutorialImage src={require<string>('../assets/finding-sensor.svg')} />
      <img className="InlineSpinner" src={require<string>('../assets/spinner.svg')}/>
      <p className="instruction">Hold your phone near the sensor.</p>
      <p style={{opacity: 0.1, textAlign: 'center'}}>{BTState[this.props.bluetoothManager.state]}</p>
    </Page>
  }
}