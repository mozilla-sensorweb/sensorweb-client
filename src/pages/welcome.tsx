import React from 'react';
import { Page, NavigationState } from '../ui';

export let WelcomePage = (props: { nav: NavigationState }) => (
  <Page nav={props.nav}>
    <h1>Welcome!</h1>
    <p>Some exciting text here! That's short and fun.</p>
    <button onClick={() => props.nav.markComplete()}>Get Started</button>
    <p>Already have a sensor that's setup? Move your device closer to the sensor to
       have it reconnect to your phone.</p>
    <p></p>
    <p>Don't have a sensor? Join in the fun now! And probably a few more lines of copy talking about
    SensorWeb and its awesomeness.</p>
    <button className="secondary">Buy a Sensor Now</button>
    <p>Copy about the app being for connecting with a sensor. If you want the data, please visit
      &nbsp;<a href="#">https://sensorweb.com/</a>.</p>
  </Page>
);