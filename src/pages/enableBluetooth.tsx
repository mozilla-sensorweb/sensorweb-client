import React from 'react';
import { Page, NavigationState, TutorialImage } from '../ui';
import { BluetoothManager } from '../bluetooth';

interface EnableBluetoothPageProps {
  nav: NavigationState,
  bluetoothManager: BluetoothManager;
}

export function EnableBluetoothPage(props: EnableBluetoothPageProps) {
  return <Page nav={props.nav} title='Enable Bluetooth' next={false}>
      <div/>
      <TutorialImage src={require<string>('../assets/bluetooth.svg')} />
      <p className="instruction">Please enable bluetooth to continue.</p>
      <a className="button " onClick={() => props.bluetoothManager.enable()}>Enable Bluetooth</a>
    </Page>;
}