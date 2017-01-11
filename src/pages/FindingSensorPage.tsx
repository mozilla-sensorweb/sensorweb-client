import React from 'react';
import { Page, PageHeader, PageContent, Section } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { when } from 'mobx';
import { BluetoothManager, BTState } from '../bluetooth';
import { TextEncoder } from 'text-encoding';

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
    this.dispose = when('bluetooth connected',
      () => this.props.bluetoothManager.state === BTState.Connected,
      () => this.sync());

    // setTimeout(() => {
    //   this.props.bluetoothManager.connectToNearestSensor();
    // }, 1000);
  }

  sync() {
    let state = this.props.appState;

    const SERVICE = '0123';
    let encoder = new TextEncoder('utf-8');

    type QueueItem = { uuid: string, value: ArrayBuffer };
    let queue: QueueItem[] = [];
    let locationArray = new DataView(new ArrayBuffer(8));
    locationArray.setFloat32(0, state.location && state.location.lat() || 0);
    locationArray.setFloat32(4, state.location && state.location.lng() || 0);
    queue.push({ uuid: '0002', value: locationArray.buffer });

    let altitudeArray = new DataView(new ArrayBuffer(4));
    altitudeArray.setInt32(0, state.altitude || 0);
    queue.push({ uuid: '0003', value: altitudeArray.buffer });

    let headingArray = new DataView(new ArrayBuffer(4));
    headingArray.setInt32(0, state.heading || 0);
    queue.push({ uuid: '0004', value: headingArray.buffer });

    let ssidArray: Uint8Array = encoder.encode(state.ssid || '');
    queue.push({ uuid: '0005', value: ssidArray.buffer.slice(0, 20) });
    queue.push({ uuid: '0006', value: ssidArray.buffer.slice(20, 40) });

    let ssidLengthArray = new DataView(new ArrayBuffer(4));
    ssidLengthArray.setInt32(0, ssidArray.byteLength);
    queue.push({ uuid: '0007', value: ssidLengthArray.buffer });

    let passwordArray: Uint8Array = encoder.encode(state.password || '');
    queue.push({ uuid: '0008', value: passwordArray.buffer.slice(0, 20) });
    queue.push({ uuid: '0009', value: passwordArray.buffer.slice(20, 40) });
    queue.push({ uuid: '000A', value: passwordArray.buffer.slice(40, 60) });
    queue.push({ uuid: '000B', value: passwordArray.buffer.slice(60, 80) });

    let passwordLengthArray = new DataView(new ArrayBuffer(4));
    passwordLengthArray.setInt32(0, passwordArray.byteLength);
    queue.push({ uuid: '000C', value: passwordLengthArray.buffer });

    let actionArray = new DataView(new ArrayBuffer(4));
    actionArray.setInt32(0, 1);
    queue.push({ uuid: '0001', value: actionArray.buffer });

    let promise = Promise.resolve();
    while (queue.length) {
      promise = promise.then(((item: QueueItem) => {
        console.log(`Writing ${item.uuid} (${item.value.byteLength} bytes)`);
        return this.props.bluetoothManager.write(SERVICE, item.uuid, item.value);
      }).bind(null, queue.shift()));
    }
    promise = promise.then(() => {
      console.log('WROTE!');
      this.props.nav.markComplete();
    }, (err) => {
      console.error('ERROR:', err);
    });
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
        <Section>
          <p>SSID: {state.ssid} {state.password}<br/>
            Altitude: {state.altitude}<br/>

            Direction: {state.heading}</p>
        </Section>
        <img className="InlineSpinner" src={require<string>('../assets/spinner.svg')}/>
        <div>
          <p className="instruction">Hold your phone near the sensor.</p>
          <p style={{opacity: 0.1, textAlign: 'center'}}>{BTState[this.props.bluetoothManager.state]}…</p>
        </div>
      </PageContent>
    </Page>;
  }
}