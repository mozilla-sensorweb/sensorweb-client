import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, TutorialImage, NavigationState } from '../ui';

interface AllowLocationPageProps {
  nav: NavigationState;
  locationState: { location: google.maps.LatLng };
}

@observer
export class AllowLocationPage extends React.Component<AllowLocationPageProps, {}> {
  @observable waitingForServer = false;

  allowLocation() {
    this.waitingForServer = true;
    navigator.geolocation.getCurrentPosition((location) => {
      // We don't set waitingForServer to false here, because we want the button to remain disabled as the view closes.
      this.props.locationState.location = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
      this.props.nav.markComplete();
    }, (err: any) => {
      this.waitingForServer = false;
      console.error(err); // XXX display error
    }, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });
  }

  render() {
    return <Page loading={this.waitingForServer}>
      <PageHeader nav={this.props.nav} title="Allow Location"
        next={!this.waitingForServer && this.allowLocation.bind(this)} />
      <PageContent>
        <section className="centered">
          <p>To map your air quality, please provide access to your location.</p>
        </section>
        <TutorialImage src={require<string>('../assets/location.svg')} />
        <section>
          <a className="button" disabled={this.waitingForServer} onClick={this.allowLocation.bind(this)}>Allow Location</a>
        </section>
      </PageContent>
    </Page>;
  }
}
