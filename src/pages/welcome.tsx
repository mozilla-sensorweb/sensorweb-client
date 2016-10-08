import React from 'react';
import { Page, PageHeader, PageContent, NavigationState } from '../ui';

export let WelcomePage = (props: { nav: NavigationState }) => (
  <Page>
    <PageHeader nav={props.nav} title="SensorWeb" />
    <PageContent>
      <section style={{flexGrow: 1, background: `url(${require<string>('../assets/welcome.jpg')}) 50% 13% / cover no-repeat`}} />
      <section className="centered">
        <p style={{fontWeight:300}}>Thank you for buying a<br/>SensorWeb air quality sensor.</p>
      </section>
      <section className="centered">
        <a className="button" onClick={() => props.nav.markComplete()}>Set up my sensor</a>
        <p className="detail instruction">Don't have a sensor? <a href="#">Buy one here</a>.</p>
      </section>
      <p className="detail instruction">View sensor data at <a href="https://sensorweb.com/">sensorweb.com</a>.</p>
    </PageContent>
  </Page>
);