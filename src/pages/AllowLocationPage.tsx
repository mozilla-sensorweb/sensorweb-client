import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, Section } from '../ui';
import { NavigationState } from '../state';

interface AllowLocationPageProps {
  nav: NavigationState;
}

@observer
export default class AllowLocationPage extends React.Component<AllowLocationPageProps, {}> {

  submit() {
    this.props.nav.markComplete();
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title="Finding Your Location"
        next={this.submit.bind(this)} />
      <PageContent>
        <Section>
        <p>To connect your sensor, we need to learn a bit more about where your sensor is located.</p>
        <p>This location information will be used to contribute accurate and local information to everyone using SensorWeb.&nbsp;
          <strong>While details about your location will not be shown publicly, the rough location of your sensor will be shown on the map.</strong>
        </p>
        <p>It will also be used to help bring you data from the closest sensors around you.</p>
        <hr />
        <p>Already have a sensor that’s set up? Move your device closer to the sensor to have it reconnect to your phone.</p>
        </Section>
      </PageContent>
    </Page>;
  }
}
