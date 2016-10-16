import React from 'react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
import { NavigationState } from '../state';
import { BluetoothManager } from '../bluetooth';

interface EnableBluetoothPageProps {
  nav: NavigationState,
  bluetoothManager: BluetoothManager;
}

export default function EnableBluetoothPage(props: EnableBluetoothPageProps) {
  return <Page>
      <PageHeader nav={props.nav} title='Enable Bluetooth'
        next={() => props.bluetoothManager.enable()} />
      <PageContent>
        <section className="instruction" style={{flexGrow: 1}}>
          <p>Please enable bluetooth to continue.</p>
        </section>
        <section>
          <a className="button" onClick={() => props.bluetoothManager.enable()}>Enable Bluetooth</a>
        </section>
      </PageContent>
    </Page>;
}