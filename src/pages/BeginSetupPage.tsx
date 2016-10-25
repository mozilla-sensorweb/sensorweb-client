import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

export default function BeginSetupPage(props: { nav: NavigationState }) {
  return <Page>
    <PageHeader nav={props.nav} next={() => props.nav.markComplete()}
      title="Sensor Setup" />
    <PageContent>
      <section className="instruction">
        <p>Let’s set up your new sensor. This will take about five minutes.</p>
      </section>
      <section>
        <a className="button" onClick={() => props.nav.markComplete()}>Get Started</a>
      </section>
      <section className="detail">
        <p><strong>Already have a sensor that has been set up?</strong> Move your device closer
        to the sensor to have it reconnect to your phone.</p>
        <p><a href="#">Log in with your Firefox Account</a></p>
      </section>
    </PageContent>
  </Page>;
}