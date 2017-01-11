import React from 'react';
import { Page, PageHeader, PageContent, Section, Button } from '../ui';
import { NavigationState } from '../state';
import { BluetoothManager } from '../bluetooth';

interface EnableBluetoothPageProps {
  nav: NavigationState;
  bluetoothManager: BluetoothManager;
}

export default function EnableBluetoothPage(props: EnableBluetoothPageProps) {
  return <Page>
      <PageHeader nav={props.nav} title='Enable Bluetooth'
        next={() => props.bluetoothManager.enable()} />
      <PageContent>
        <Section>
          <p>Please enable bluetooth to continue.</p>
          <Button onClick={() => props.bluetoothManager.enable()}>Enable Bluetooth</Button>
        </Section>
      </PageContent>
    </Page>;
}