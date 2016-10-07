import React from 'react';
import { Page, NavigationState } from '../ui';
import { BluetoothManager } from '../bluetooth';

interface EnableBluetoothPageProps {
  nav: NavigationState,
  bluetoothManager: BluetoothManager;
}

export function EnableBluetoothPage(props: EnableBluetoothPageProps) {
  return <Page nav={this.props.nav}>
      <h1>Enable Bluetooth</h1>
      <p>Please enable bluetooth to continue.</p>
      <button onClick={() => this.props.bluetoothManager.enable()}>Enable Bluetooth</button>
    </Page>;
}