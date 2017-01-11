import React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import { uniqBy } from 'lodash';
const { default: styled } = require<any>('styled-components');

import { Page, PageHeader, PageContent, Section } from '../ui';
import { NavigationState } from '../state';

export interface WifiScanResult {
  level: number; // -58
  SSID: string;
  BSSID: string; // "b8:9b:c9:5d:2e:6b"
  frequency: number; // 2452
  capabilities: string; // "[WPA-PSK-CCMP+TKIP][WPA2-PSK-CCMP+TKIP][ESS]"
}

function networkRequiresPassword(network: WifiScanResult): boolean {
  return /WPA|WEP/.test(network.capabilities);
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

interface WifiCredentialsPageProps {
  nav: NavigationState;
  onConfirm(ssid: string, password: string): void;
}

@observer
export default class WifiCredentialsPage extends React.Component<WifiCredentialsPageProps, {}> {
  @observable availableNetworks: WifiScanResult[] = [];
  @observable scanning = true;
  @observable typedPassword = '';
  @observable firstScanComplete = false;
  @observable selectedNetwork?: WifiScanResult;
  @observable choosingNetwork = false;

  componentWillMount() {
    setTimeout(() => {
      this.scan();
    }, 1000);
  }

  @computed
  get requiresPassword() {
    if (!this.selectedNetwork) {
      return false;
    } else {
      return networkRequiresPassword(this.selectedNetwork);
    }
  }

  async scan() {
    this.scanning = true;

    let ssid = '';
    let networks: WifiScanResult[] = [];
    try {
      ssid = await getCurrentSsid();
    } catch (err) {
      console.warn('Unable to get current WiFi network', err);
    }
    try {
      networks = await scanForWifiNetworks();
      networks.sort((a, b) => a.SSID.localeCompare(b.SSID));
    } catch (err) {
      // Note: This error is expected on iOS.
      console.warn('Unable to scan for WiFi networks.', err);
    }

    this.availableNetworks = networks;

    let currentNetwork = networks.find((network) => network.SSID === ssid);
    console.log('current network = ' + currentNetwork + ' ssid ' + ssid);
    if (ssid && !currentNetwork) {
      currentNetwork = {
        SSID: ssid,
        BSSID: '',
        level: 0,
        frequency: 0,
        capabilities: '[UNKNOWN]'
      };
    }

    this.scanning = false;
    if (!this.firstScanComplete && currentNetwork) {
      this.onNetworkSelected(currentNetwork);
    }
    this.firstScanComplete = true;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      this.submit();
    }
  }

  onNetworkSelected(network: WifiScanResult) {
    // If we could automatically select the current network, we've done it now.
    // We don't want to try more than once.
    this.selectedNetwork = network;
    this.choosingNetwork = false;
  }

  submit() {
    if (this.selectedNetwork) {
      this.props.onConfirm(this.selectedNetwork.SSID, this.typedPassword);
      this.props.nav.markComplete();
    }
  }

  onSelectAnotherNetwork() {
    this.choosingNetwork = true;
  }

  isValid(): boolean {
    return !!(this.selectedNetwork && (!this.requiresPassword || this.typedPassword));
  }

  renderSelectWifiNetworkModal() {
    return (
      <Page modal visible={this.choosingNetwork}>
        <PageHeader modal nav={this.props.nav} title="Select Network" back={() => {
          this.choosingNetwork = false;
        } } />
        <PageContent>
          <Section>
            <p>Select the Wi-Fi network you want your sensor to use.</p>
          </Section>
          <Section grow flexVertical>
            <List>
              {this.availableNetworks.map((network) =>
                <li key={network.SSID}
                  data-ssid={network.SSID}
                  onClick={(e) => this.onNetworkSelected(network)}>
                  {networkRequiresPassword(network) &&
                    <img src={require<string>('../assets/lock.svg')}
                      style={{float: 'right', width: '1em', height: '1.4em'}} />}
                  {network.SSID}
                </li> /* XXX: lock icon */
              )}
            </List>
          </Section>
        </PageContent>
      </Page>
    );
  }

  render() {
    return (
      <Page loading={!this.firstScanComplete}>
        {this.renderSelectWifiNetworkModal()}
        <PageHeader nav={this.props.nav} title="Connect to Wi-Fi"
          next={this.isValid() && this.submit.bind(this)} />
        <PageContent>
          <Section>
            <p>Enter the password of your Wi-Fi network.</p>
          </Section>
          <Section>
            <p><label htmlFor="password">Network Name</label><br />
              <input id="ssid"
                type="text"
                readOnly
                onClick={(e) => this.onSelectAnotherNetwork()}
                style={{ fontSize: 'larger' }}
                value={this.selectedNetwork ? this.selectedNetwork.SSID : ''} /></p>
            {this.requiresPassword &&
              <p><label htmlFor="password">Password</label><br />
                <input id="password"
                  type="password"
                  value={this.typedPassword}
                  onKeyDown={this.onKeyDown.bind(this)}
                  style={{ fontSize: 'larger' }}
                  onChange={(e) => this.typedPassword = e.currentTarget.value} />
              </p>
            }
            <p><a href="#" onClick={(e) => this.onSelectAnotherNetwork()}>
              Choose a different Wi-Fi network</a></p>
          </Section>
        </PageContent>
      </Page>
    );
  }
}

const List = styled.ul`
  flex-grow: 1;
  flex-basis: 100px;
  list-style: none;
  padding-left: 0;
  border: 1px solid #999;
  overflow-y: scroll;
  background: white;
  & li {
    border-bottom: 1px solid #eee;
    padding: 0.5em 1em;

    &:active {
      color: white;
      background-color: black;
    }
  }
`;