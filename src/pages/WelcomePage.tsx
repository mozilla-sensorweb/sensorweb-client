import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { Button, Section } from '../ui';
import { NavigationState } from '../state';

export default function WelcomePage(props: { nav: NavigationState }) {
  return <Page>
    <PageHeader nav={props.nav} noProgress title="Welcome" />
    <PageContent>
      <Section>
        <p>Congratulations on purchasing your Perch device!
          SensorWeb collects air quality data from sensors like yours.
          Let’s set up your sensor now.
        </p>
        <Button primary onClick={() => props.nav.markComplete()}>Get Started</Button>
        <p>
          Want to see what others are contributing? View the map of data.</p>
        <Button onClick={() => {
          window.open('http://google.com', '_system');
        }}>View Sensors Around Me</Button>
      </Section>
    </PageContent>
  </Page>;
}