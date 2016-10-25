import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
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
        <section style={{flexGrow: 1}}>
          <p className="instruction">
            Your sensor will send air quality data from your location
              to our cloud service, anonymously and securely.
          </p>
          <br/>
          <div className="detail">
            <p>To store accurate data, we’ll need to know your location, direction,
              altitude, and WiFi connection information. This information will be shared
              [in ways we will describe in the future].</p>
          </div>
        </section>
        {/*<section>
          <a className="button" onClick={this.submit.bind(this)}>Allow Location</a>
        </section>*/}
      </PageContent>
    </Page>;
  }
}
