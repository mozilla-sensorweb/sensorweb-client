import React from 'react';
import { Page, NavigationState } from '../ui';

export let WelcomePage = (props: { nav: NavigationState }) => (
  <Page nav={props.nav} title='Welcome' hideHeader={true}>
    <div style={{height: '14rem', margin: '0 -1rem', background: `url(${require<string>('../assets/welcome.jpg')}) 50% 13% / cover no-repeat`}}/>
    <p className="instruction" style={{fontWeight:300}}>Thank you for buying a<br/>SensorWeb air quality sensor.</p>
    <div>
      <a className="button" onClick={() => props.nav.markComplete()}>Set up my sensor</a>
      <p className="detail instruction">Don't have a sensor? <a href="#">Buy one here</a>.</p>
    </div>
    <p className="detail instruction">View sensor data at <a href="https://sensorweb.com/">sensorweb.com</a>.</p>
  </Page>
);