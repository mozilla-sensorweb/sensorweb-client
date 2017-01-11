import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, Section } from '../ui';
import { NavigationState } from '../state';

interface NetConnectionModalProps {
  nav: NavigationState;
  visible: boolean;
}

@observer
export default class NetConnectionModal extends React.Component<NetConnectionModalProps, {}> {
  render() {
    return (
      <Page modal visible={this.props.visible}>
        <PageHeader modal nav={this.props.nav} title="Network Connection Required" back={false} />
        <PageContent>
          <Section>
            <p>SensorWeb requires an internet connection. Please enable WiFi or cellular data to continue.</p>
          </Section>
        </PageContent>
      </Page>
    );
  }
}


