import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, TutorialImage } from '../ui';
import { NavigationState } from '../state';

interface AllowLocationPageProps {
  nav: NavigationState;
  saveLocation(location?: google.maps.LatLng): void;
}

@observer
export default class AllowLocationPage extends React.Component<AllowLocationPageProps, {}> {
  @observable loading = false;

  allowLocation() {
    this.loading = true;
    navigator.geolocation.getCurrentPosition((location) => {
      // We don't set loading to false here, because we want the button to remain disabled as the view closes.
      this.props.saveLocation(new google.maps.LatLng(location.coords.latitude, location.coords.longitude));
      this.props.nav.markComplete();
    }, (err: any) => {
      // XXX: continue?
      this.props.saveLocation(undefined);
      this.loading = false;
      this.props.nav.markComplete();
      console.error(err); // XXX display error
    }, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });
  }

  render() {
    return <Page loading={this.loading}>
      <PageHeader nav={this.props.nav} title="Allow Location"
        next={!this.loading && this.allowLocation.bind(this)} />
      <PageContent>
        <section className="instruction">
          <p>To map your air quality, please provide access to your location.</p>
        </section>
        <TutorialImage src={require<string>('../assets/location.svg')} />
        <section>
          <a className="button" disabled={this.loading} onClick={this.allowLocation.bind(this)}>Allow Location</a>
        </section>
      </PageContent>
    </Page>;
  }
}
