import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

export default function WelcomePage(props: { nav: NavigationState }) {
  return <Page>
    <PageHeader nav={props.nav} noProgress title="SensorWeb" />
    <PageContent>
      <section className="">
        <a className="button" onClick={() => props.nav.markComplete()}>I have a Sensor</a>
      </section>
      <section>
        <p className="detail">
          Don't have a sensor? Start contributing data by purchasing a sensor.</p>
        <a className="button secondary small" onClick={() => {
          window.open('http://google.com', '_system');
        }}>Buy a Sensor Now</a>
      </section>
      <section>
        <p className="detail">
          Want to see what others are contributing? View the map of data.</p>
        <a className="button secondary small" onClick={() => {
          window.open('http://google.com', '_system');
        }}>View Air Quality</a>
      </section>
    </PageContent>
  </Page>;
}