import React from 'react';
import { observable, autorunAsync, untracked, runInAction, action, computed, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, NavigationState } from '../ui';

interface SelectLocationPageProps {
  nav: NavigationState;
  locationState: { location: google.maps.LatLng };
}

let MAPS_API_KEY = 'AIzaSyA_QULMpHLgnha_jMe-Ie-DancN1Bz4uEE';
let MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMap`;

let script = document.createElement('script');
script.async = true;

script.src = MAPS_API_URL;
document.getElementsByTagName('head')[0].appendChild(script);

(window as any).initMap = function () {
  console.log('maps loaded');
}

@observer
export class SelectLocationPage extends React.Component<SelectLocationPageProps, {}> {
  map: google.maps.Map;
  mapDiv: HTMLElement;
  gpsControl: HTMLElement;
  addressInput: HTMLInputElement;
  disposers: (() => void)[] = [];
  isDragging: boolean;
  @observable locationString: string = '';
  @observable typedAddress: string = '';
  @observable inputFocused: boolean = false;
  @observable waitingForGeocoding: boolean = false;
  @observable currentGpsLocation: google.maps.LatLng;


  componentDidMount() {
    this.currentGpsLocation = this.props.locationState.location;

    // XXX: retry google maps, warn on no internet
    if (typeof google === 'undefined') {
      (window as any).initMap = this.loadMap.bind(this);
    } else {
      setTimeout(() => {
        this.loadMap();
      }, 0);
    }


    // If we're already tracking the current GPS location, move it to match.
    let watchPositionId = navigator.geolocation.watchPosition((location) => {
      if (this.isCurrentlyTrackingGps) {
        this.currentGpsLocation = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
        this.props.locationState.location = this.currentGpsLocation;
      }
    }, (err: any) => {
      console.error(err); // XXX display error
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000
    });
    this.disposers.push(() => navigator.geolocation.clearWatch(watchPositionId));
  }

  @computed
  get isCurrentlyTrackingGps() {
    return this.currentGpsLocation.equals(this.props.locationState.location);
  }

  loadMap() {
    if (!this.mapDiv) {
      return;
    }

    this.map = new google.maps.Map(this.mapDiv, {
      center: this.props.locationState.location,
      zoom: 18,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    });

    let pin = document.createElement('div');
    pin.classList.add('gps-pin');
    this.mapDiv.appendChild(pin);

    this.gpsControl = document.createElement('div');
    let controlText = document.createElement('img');
    this.gpsControl.classList.add('gps-control');
    controlText.src = require<string>('../assets/gps-pointer.svg');
    this.gpsControl.appendChild(controlText);
    this.gpsControl.onclick = action(() => {
      this.locationString = '';
      this.props.locationState.location = this.currentGpsLocation;
      this.map.panTo(this.props.locationState.location);
    });
    this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.gpsControl);

    let listener = this.map.addListener('center_changed', () => {
      console.log("CENTER_CHANGED");
      this.props.locationState.location = this.map.getCenter();
    });
    this.disposers.push(() => listener.remove());

    listener = this.map.addListener('dragstart', () => {
      this.gpsControl.classList.toggle('following', false);
      this.isDragging = true;
    });
    this.disposers.push(() => listener.remove());
    listener = this.map.addListener('dragend', () => {
      this.isDragging = false;
      this.props.locationState.location = this.map.getCenter();
    });
    this.disposers.push(() => listener.remove());

    listener = this.map.addListener('click', () => {
      this.addressInput.blur();
    });
    this.disposers.push(() => listener.remove());

    this.disposers.push(autorunAsync(() => {
      let loc = this.props.locationState.location;
      untracked(() => {
        let geo = new google.maps.Geocoder();
        if (this.inputFocused) {
          console.log('not geocoding because inputFocused');
          return;
        }
        if (this.isDragging) {
          console.log('not geocoding because dragging');
          return;
        }
        if (this.locationString && this.isCurrentlyTrackingGps) {
          console.log('already have address for current GPS, ignoring');
          return;
        }
        console.log('geocoding...');
        geo.geocode({
          location: loc
        }, (results, status) => {
          console.log('geocode result ' + (results && results[0]) + ' ' + status);
          if (results && results[0]) {
            this.locationString = results[0].formatted_address;
          }
        });
      });
    }, 1000));

    this.disposers.push(reaction(() => this.props.locationState.location, () => {
      if (this.isDragging) {
        return; // Don't try to recenter the map while the user is dragging.
      }
      console.log("SET CENTER FROM LOC");
      console.log(this.props.locationState.location.toUrlValue());
      this.map.setCenter(this.props.locationState.location);
    }));

    // When the keyboard pops up, recenter the map on the proper address.
    let resizeHandler = () => {
      google.maps.event.trigger(this.map, 'resize');
      //this.recenterOnLocation();
    };
    addEventListener('resize', resizeHandler);
    this.disposers.push(() => {
      removeEventListener('resize', resizeHandler);
    });
  }

  componentDidUpdate() {
    google.maps.event.trigger(this.map, 'resize');
    this.gpsControl.classList.toggle('following', this.isCurrentlyTrackingGps);
    //this.recenterOnLocation();
  }

  recenterOnLocation() {
    //this.map.setCenter(this.props.locationState.location);
  }

  componentWillUnmount() {
    this.disposers.forEach((disposer) => disposer());
    (window as any).initMap = () => { };
  }

  confirmLocation() {
    console.log('CONFIRM? ' + this.typedAddress);
    this.props.nav.markComplete();
  }

  findManuallyEnteredAddress() {
    let geo = new google.maps.Geocoder();
    this.waitingForGeocoding = true;
    geo.geocode({
      address: this.typedAddress
    }, (results, status) => {
      // XXX if no address, handle error (maybe clear input?)
      if (!results || !results[0]) {
        console.log('unable to geocode: ' + status);
        this.addressInput.blur();
        return;
      }
      runInAction(() => {
        this.waitingForGeocoding = false;
        console.log('blur address');
        this.addressInput.blur();
        this.props.locationState.location = results[0].geometry.location;
        this.locationString = results[0].formatted_address;
        console.log('nulling typed address');
        this.typedAddress = '';
        console.log("RESULTS " + JSON.stringify(results), results);
      });
    });
  }

  render() {
    return <Page>
      <PageHeader nav={this.props.nav} title="Select Location"
        next={!this.waitingForGeocoding && !this.inputFocused && (() => this.confirmLocation())} />
      <PageContent>
        <section className="centered">
          <p>Drag the map to adjust your location.</p>
        </section>
        <input type="text"
          ref={(el) => this.addressInput = el}
          disabled={this.waitingForGeocoding}
          onChange={(e) => this.typedAddress = e.currentTarget.value}
          onKeyDown={(e) => { if (e.keyCode === 13) this.findManuallyEnteredAddress(); } }
          onFocus={(e) => this.inputFocused = true}
          onBlur={(e) => this.inputFocused = false}
          onClick={(e) => e.currentTarget.select()}
          style={{ fontSize: 'smaller', 'textAlign': 'center' }} value={this.typedAddress} placeholder={this.locationString} />
        <div className="map-div" ref={(e) => this.mapDiv = e} style={{ flexGrow: 1 }}>Map</div>
        <section>
          {/* NOTE: We use onMouseDown for the first button because it arrives before onBlur, which causes the button to swap to
          the confirmLocation button before we have a chance to handle the event. */}
          {this.inputFocused
            ? <a className="button small" disabled={this.waitingForGeocoding} onMouseDown={(e) => this.findManuallyEnteredAddress()}>Find Address</a>
            : <a className="button" disabled={this.waitingForGeocoding} onClick={(e) => this.confirmLocation()}>Confirm Location</a>}
        </section>
      </PageContent>
    </Page>;
  }
}
