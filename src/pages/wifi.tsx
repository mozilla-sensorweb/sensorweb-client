import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { uniqBy } from 'lodash';

import { Page, NavigationState } from '../ui';

interface WifiScanResult {
  level: number; // -58
  SSID: string;
  BSSID: string; // "b8:9b:c9:5d:2e:6b"
  frequency: number; // 2452
  capabilities: string; // "[WPA-PSK-CCMP+TKIP][WPA2-PSK-CCMP+TKIP][ESS]"
}

class FakeWifiWizard {
  getScanResults(params: {}, listHandler: (networks: WifiScanResult[]) => void, err: (err: any) => void) {
    setTimeout(() => {
      let ssids = ['My Wifi', 'Neighbor’s Wifi', 'Hotspot', 'Wifi 5', 'Wifi 6', 'Wifi 7', 'Wifi 8', 'Wifi 9'];
      listHandler(ssids.map((ssid: string): WifiScanResult => ({
        level: -50,
        SSID: ssid,
        BSSID: "00:00:00:00:00:00",
        frequency: 0,
        capabilities: '[WPA-PSK][ESS]'
      })));
    }, 500);
  }

  getCurrentSSID(cb: (ssid: string) => void) {
    setTimeout(() => cb('My Wifi'), 1000);
  }
}


if (!(window as any).cordova) {
  (window as any).WifiWizard = new FakeWifiWizard();
}

function scanForWifiNetworks(): Promise<WifiScanResult[]> {
  let WifiWizard: any = (window as any).WifiWizard;
  if (!WifiWizard) {
    return Promise.reject('No WifiWizard plugin!');
  }
  return new Promise((resolve, reject) => {
    WifiWizard.getScanResults({}, (networks: WifiScanResult[]) => {
      resolve(uniqBy(networks.filter((network) => network.SSID !== ''), (network) => network.SSID));
    }, reject);
  });
}

function getCurrentSsid(): Promise<string> {
  let WifiWizard: any = (window as any).WifiWizard;
  if (!WifiWizard) {
    return Promise.reject('No WifiWizard plugin!');
  }
  return new Promise((resolve, reject) => {
    WifiWizard.getCurrentSSID((ssid: string) => {
      if (ssid === '0x') {
        ssid = ''; // The Android API could return '0x' if the user is not connected to any network.
      }
      // XXX: "string of hex digits", "<unknown ssid>", ...
      let quotedMatch = /^"(.*)"$/.exec(ssid);
      if (quotedMatch) {
        ssid = quotedMatch[1];
      }
      resolve(ssid);
    }, reject);
  });
}

interface WifiSetupFlowProps {
  nav: NavigationState;
  onConnected(ssid: string, password: string): void;
}

@observer
export class WifiSetupFlow extends React.Component<WifiSetupFlowProps, {}> {
  @observable selectedNetwork: WifiScanResult | null = null;
  @observable attemptedCurrentNetwork = false;

  onNetworkSelected(network: WifiScanResult) {
    // If we could automatically select the current network, we've done it now.
    // We don't want to try more than once.
    this.attemptedCurrentNetwork = true;
    this.selectedNetwork = network;
  }

  onConfirm(password: string) {
    if (!this.selectedNetwork) {
      return;
    }
    this.props.onConnected(this.selectedNetwork.SSID, password);
  }

  onSelectAnotherNetwork() {
    this.selectedNetwork = null;
  }

  render() {
    if (!this.selectedNetwork) {
      return <SelectWifiNetwork
               nav={this.props.nav}
               attemptedCurrentNetwork={this.attemptedCurrentNetwork}
               onNetworkSelected={this.onNetworkSelected.bind(this)} />;
    } else {
      return <EnterPassword
        nav={this.props.nav}
        network={this.selectedNetwork}
        onConfirm={this.onConfirm.bind(this)}
        onSelectAnotherNetwork={this.onSelectAnotherNetwork.bind(this)} />;
    }
  }
}

interface SelectWifiNetworkProps {
  nav: NavigationState;
  attemptedCurrentNetwork: boolean;
  onNetworkSelected(string: WifiScanResult): void;
}

@observer
class SelectWifiNetwork extends React.Component<SelectWifiNetworkProps, {}> {
  @observable availableNetworks: WifiScanResult[] = [];
  @observable scanning = true;

  constructor(props: SelectWifiNetworkProps) {
    super(props);

    setTimeout(() => {
      this.scan();
    }, 1000);
  }

  scan() {
    this.scanning = true;

    getCurrentSsid().then((ssid) => {
      scanForWifiNetworks().then((networks) => {
        networks = networks.slice();
        networks.sort((a, b) => a.SSID.localeCompare(b.SSID));

        let currentNetwork = networks.find((network) => network.SSID === ssid);
        console.log('current netowrk = ' + currentNetwork + ' ssid ' + ssid);

        if (!this.props.attemptedCurrentNetwork && currentNetwork) {
          this.props.onNetworkSelected(currentNetwork);
        } else {
          this.availableNetworks = networks;
          this.scanning = false;
        }
      });
    });
  }

  render() {
    return (
      <Page nav={this.props.nav} loading={this.scanning}>
        <h1>Connect to Wi-Fi</h1>
        <p>Select the Wi-Fi network you want your sensor to use.</p>
        <ul className="WifiList">
        {this.availableNetworks.map((network) =>
          <li key={network.SSID}
              data-ssid={network.SSID}
              onClick={(e) => this.props.onNetworkSelected(network)}>
            {network.SSID}
          </li> /* XXX: lock icon */
        )}
        </ul>
      </Page>
    );
  }
}


interface EnterPasswordProps {
  nav: NavigationState;
  network: WifiScanResult;
  onConfirm(password: string): void;
  onSelectAnotherNetwork(): void;
}

@observer
class EnterPassword extends React.Component<EnterPasswordProps, {}> {
  @observable typedPassword = '';

  onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      this.props.onConfirm(this.typedPassword);
    }
  }

  render() {
    return (
      <Page nav={this.props.nav}>
        <h1>Connect to Wi-Fi</h1>
        <p>Enter the password of your Wi-Fi network.</p>
        <p><label>Wi-Fi Network<br/>
          <input readOnly onClick={(e) => this.props.onSelectAnotherNetwork()}
              value={this.props.network.SSID} /></label></p>
        {!/WPA|WEP/.test(this.props.network.capabilities) ? null :
          <p><label>Password<br/>
            <input type="password"
                   value={this.typedPassword}
                   onKeyDown={this.onKeyDown.bind(this)}
                   onChange={(e) => this.typedPassword = e.currentTarget.value } />
          </label></p>
        }
        <p><a href="#" onClick={(e) => this.props.onSelectAnotherNetwork()}>Choose a different Wi-Fi network</a></p>
      </Page>
    );
  }
}
