import React from 'react';
import { Page, NavigationState } from '../ui';

export let WelcomePage = (props: { nav: NavigationState }) => (
  <Page nav={props.nav} title='Welcome'>
    <p>Some exciting text here! That's short and fun.</p>
    <a className="button" onClick={() => props.nav.markComplete()}>Get Started</a>
    <p>Already have a sensor that's setup? Move your device closer to the sensor to
       have it reconnect to your phone.</p>
    <p>Don't have a sensor? Join in the fun now! And probably a few more lines of copy talking about
    SensorWeb and its awesomeness.</p>
    <a className="button secondary">Buy a Sensor Now</a>
    <p>Copy about the app being for connecting with a sensor. If you want the data, please visit
      &nbsp;<a href="#">https://sensorweb.com/</a>.</p>
  </Page>
);