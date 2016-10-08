import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, TutorialImage, NavigationState } from '../ui';


export interface Location {
  latitude: number;
  longitude: number;
}

interface LocationState {
  location: Location;
}

interface AllowLocationPageProps {
  nav: NavigationState;
  locationState: LocationState;
}

@observer
export class AllowLocationPage extends React.Component<AllowLocationPageProps, {}> {
  allowLocation() {
    navigator.geolocation.getCurrentPosition((location) => {
      this.props.locationState.location = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      this.props.nav.markComplete();
    }, (err: any) => {
      console.error(err); // XXX display error
    }, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title="Allow Location" />
      <PageContent>
        <section className="centered">
          <p>To map your air quality, please provide access to your location.</p>
        </section>
        <TutorialImage src={require<string>('../assets/location.svg')} />
        <section>
          <a className="button" onClick={this.allowLocation.bind(this)}>Allow Location</a>
        </section>
      </PageContent>
    </Page>;
  }
}


interface SelectLocationPageProps {
  nav: NavigationState;
  locationState: LocationState;
  //onLocationSelected(location: Location): void;
}

let MAPS_API_KEY = 'AIzaSyA_QULMpHLgnha_jMe-Ie-DancN1Bz4uEE';
let MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`;

let script = document.createElement('script');
script.async = true;

script.src = MAPS_API_URL;
document.getElementsByTagName('head')[0].appendChild(script);

(window as any).initMap = function() {
  console.log('maps loaded');
}

@observer
export class SelectLocationPage extends React.Component<SelectLocationPageProps, {}> {
  @observable location: Location | undefined;
  map: google.maps.Map;
  mapDiv: HTMLElement;
  listeners: google.maps.MapsEventListener[];

  componentDidMount() {
    this.listeners = [];

    // XXX: retry google maps, warn on no internet
    if (typeof google === 'undefined') {
      (window as any).initMap = this.loadMap.bind(this);
    } else {
      setTimeout(() => {
        this.loadMap();
      }, 0);
    }

  }

  loadMap() {
    if (!this.mapDiv) {
      return;
    }

    this.map = new google.maps.Map(this.mapDiv, {
      center: {
        lat: this.props.locationState.location.latitude,
        lng: this.props.locationState.location.longitude
      },
      zoom: 18,
      disableDefaultUI: true,
      zoomControl: true
    });

    let pin = document.createElement('div');
    pin.style.position = 'absolute';
    pin.style.top = 'calc(50% - 0.5rem)';
    pin.style.left = 'calc(50% - 0.5rem)';
    pin.style.width = '1rem';
    pin.style.height = '1rem';
    pin.style.backgroundColor = 'rgba(0, 100, 255, 0.5)';
    pin.style.borderRadius = '50%';
    this.mapDiv.appendChild(pin);

    this.listeners.push(this.map.addListener('center_changed', () => {
      let center = this.map.getCenter();
      this.location = { latitude: center.lat(), longitude: center.lng() };
      console.log('new center', this.map.getCenter().lat(), this.map.getCenter().lng);
    }));
  }

  componentWillUnmount() {
    (window as any).initMap = () => {};
    this.listeners.map((listener) => listener.remove());
    this.listeners = [];
  }


  confirmLocation() {
    //this.location && this.props.onLocationSelected(this.location);
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title="Select Location" />
      <PageContent>
        <section className="centered">
          <p>Drag the map to adjust your location.</p>
        </section>
        <div className="map-div" ref={(e) => this.mapDiv = e} style={{flexGrow: 1}}>Map</div>
        <section>
          <a className="button" onClick={(e) => this.confirmLocation()}>Confirm Location</a>
        </section>
      </PageContent>
    </Page>;
  }
}
