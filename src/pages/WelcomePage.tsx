import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

export default function WelcomePage(props: { nav: NavigationState }) {
  return <Page>
    <PageHeader nav={props.nav} title="SensorWeb Setup" next={() => props.nav.markComplete()} />
    <PageContent>
      <section className="borderless" style={{flexGrow: 1, background: `url(${require<string>('../assets/welcome.jpg')}) 50% 13% / cover no-repeat`}} />
      <section className="instruction">
        <p>Thank you for buying a<br/>SensorWeb air quality sensor.</p>
      </section>
      <section className="unpadded">
        <a className="button" onClick={() => props.nav.markComplete()}>Set up my sensor</a>
        <p className="detail" style={{textAlign: 'center'}}>
          Don't have a sensor? <a href="#">Buy one here</a>.</p>
      </section>
      <section className="">
        <p className="detail" style={{textAlign: 'center'}}>
          View sensor data at <a href="https://sensorweb.com/">sensorweb.com</a>.</p>
      </section>
    </PageContent>
  </Page>;
}