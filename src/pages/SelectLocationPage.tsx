import React from 'react';
import { observable, autorunAsync, untracked, runInAction, action, computed, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';

interface SelectLocationPageProps {
  nav: NavigationState;
  location?: google.maps.LatLng;
  saveLocation(location: google.maps.LatLng): void;
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

type Disposable = (() => void) | google.maps.MapsEventListener;

const DEFAULT_ZOOM = 18;

@observer
export default class SelectLocationPage extends React.Component<SelectLocationPageProps, {}> {
  map: google.maps.Map;
  mapDiv: HTMLElement;
  pin: HTMLDivElement;
  gpsControl: HTMLElement;
  addressInput: HTMLInputElement;
  disposers: Disposable[] = [];
  isDragging: boolean;
  @observable loading: boolean = true;
  @observable selectedLocation?: google.maps.LatLng;
  @observable locationString: string = '';
  @observable typedAddress: string = '';
  @observable inputFocused: boolean = false;
  @observable waitingForGeocoding: boolean = false;
  @observable currentGpsLocation?: google.maps.LatLng;


  componentDidMount() {
    this.selectedLocation = this.currentGpsLocation = this.props.location;

    // XXX: retry google maps, warn on no internet
    if (typeof google === 'undefined') {
      (window as any).initMap = this.loadMap.bind(this);
    } else {
      setTimeout(() => {
        this.loadMap();
      }, 0);
    }

    if (this.currentGpsLocation) {
      // If we're already tracking the current GPS location, move it to match.
      let watchPositionId = navigator.geolocation.watchPosition((location) => {
        if (this.isCurrentlyTrackingGps) {
          this.currentGpsLocation = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
          this.selectedLocation = this.currentGpsLocation;
        }
      }, (err: any) => {
        console.error(err); // XXX display error
      }, {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000
        });
      this.disposers.push(() => navigator.geolocation.clearWatch(watchPositionId));
    } else {
      setTimeout(() => {
        this.addressInput.focus();
      }, 700);
    }
  }

  @computed
  get isCurrentlyTrackingGps() {
    return this.currentGpsLocation && this.selectedLocation &&
      this.currentGpsLocation.equals(this.selectedLocation);
  }

  @action
  backToGps() {
    this.locationString = '';
    this.selectedLocation = this.currentGpsLocation;
    if (this.selectedLocation) {
      this.map.panTo(this.selectedLocation);
    }
  }

  loadMap() {
    if (!this.mapDiv) { throw new Error('Invariant: this.mapDiv must be set.'); }

    this.map = new google.maps.Map(this.mapDiv, {
      backgroundColor: 'rgb(163, 204, 255)',
      center: this.props.location || { lat: 0, lng: 100 },
      zoom: this.props.location ? DEFAULT_ZOOM : 1,
      disableDefaultUI: true,
      zoomControl: this.props.location ? true : false,
      clickableIcons: false,
    });

    this.pin = document.createElement('div');
    this.pin.classList.add('gps-pin');
    this.mapDiv.appendChild(this.pin);

    this.gpsControl = document.createElement('div');
    let controlText = document.createElement('img');
    this.gpsControl.classList.add('gps-control');
    controlText.src = require<string>('../assets/gps-pointer.svg');
    this.gpsControl.appendChild(controlText);
    this.gpsControl.onclick = (e) => this.backToGps();
    this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.gpsControl);

    if (!this.currentGpsLocation) {
      this.gpsControl.style.display = 'none';
      // don't show the pin until they enter an address and zoom in
      this.pin.style.visibility = 'hidden';
    }

    google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
      this.loading = false;
    });

    this.disposers.push(this.map.addListener('center_changed', () => {
      // Only update the location if we're interactive.
      if (this.selectedLocation) {
        this.selectedLocation = this.map.getCenter();
      }
    }));

    this.disposers.push(this.map.addListener('dragstart', () => {
      this.gpsControl.classList.toggle('following', false);
      this.isDragging = true;
    }));

    this.disposers.push(this.map.addListener('dragend', () => {
      this.isDragging = false;
      this.selectedLocation = this.map.getCenter();
    }));

    this.disposers.push(this.map.addListener('click', () => {
      this.addressInput.blur();
    }));

    this.disposers.push(autorunAsync(() => {
      let loc = this.selectedLocation;
      loc && this.locationChangedWithTimeout(loc);
    }, 500));

    this.disposers.push(reaction(() => this.selectedLocation, () => {
      if (this.selectedLocation && !this.isDragging) {
        this.map.panTo(this.selectedLocation);
      }
    }));

    // When the keyboard pops up, recenter the map on the proper address.
    let resizeHandler = () => {
      google.maps.event.trigger(this.map, 'resize');
    };
    addEventListener('resize', resizeHandler);
    this.disposers.push(() => {
      removeEventListener('resize', resizeHandler);
    });
  }

  /**
   * When the location changes (with a debounced timeout to prevent overloading geocoding limits),
   * run the geocoder to populate the address field.
   */
  @action
  locationChangedWithTimeout(location: google.maps.LatLng) {
    let geo = new google.maps.Geocoder();
    if (this.inputFocused ||
      this.isDragging ||
      // Already have the address for the current location
      (this.locationString && this.isCurrentlyTrackingGps)) {
      return;
    }

    console.log('geocoding...');
    geo.geocode({
      location: location
    }, (results, status) => {
      console.log('geocode result ' + (results && results[0]) + ' ' + status);
      if (results && results[0]) {
        this.locationString = results[0].formatted_address;
      }
    });
  }

  componentDidUpdate() {
    if (this.map) {
      google.maps.event.trigger(this.map, 'resize');
      this.gpsControl.classList.toggle('following', this.isCurrentlyTrackingGps);
    }
  }

  componentWillUnmount() {
    this.disposers.forEach((disposer) => {
      if (typeof disposer === 'function') {
        disposer();
      } else {
        disposer.remove();
      }
    });
    (window as any).initMap = () => { };
  }

  submit() {
    if (!this.selectedLocation) {
      return;
    }
    this.props.saveLocation(this.selectedLocation);
    this.props.nav.markComplete();
  }

  findManuallyEnteredAddress() {
    if (!this.typedAddress) {
      this.backToGps();
      return;
    }
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
        this.inputFocused = false;
        if (!this.selectedLocation) {
          this.map.setZoom(DEFAULT_ZOOM);
          this.map.setOptions({
            zoomControl: true
          });
        }
        this.selectedLocation = results[0].geometry.location;
        this.locationString = results[0].formatted_address;
        this.pin.style.visibility = 'visible';
        console.log('nulling typed address');
        this.typedAddress = '';
        console.log("RESULTS " + JSON.stringify(results), results);
      });
    });
  }

  render() {
    return <Page loading={false && this.loading}>
      <PageHeader nav={this.props.nav} title="Select Location"
        next={!this.waitingForGeocoding && !this.inputFocused && !!this.selectedLocation && (() => this.submit())} />
      <PageContent>
        <section className="instruction">
          {this.selectedLocation
            ? <p>Drag the map to adjust your location.</p>
            : <p>Type your address.</p>}
        </section>
        <input type="text"
          ref={(el) => this.addressInput = el}
          disabled={this.waitingForGeocoding}
          onChange={(e) => this.typedAddress = e.currentTarget.value}
          onKeyDown={(e) => { if (e.keyCode === 13) this.findManuallyEnteredAddress(); } }
          onFocus={(e) => this.inputFocused = true}
          onBlur={(e) => { this.inputFocused = false; this.findManuallyEnteredAddress(); } }
          onClick={(e) => e.currentTarget.select()}
          style={{
            fontSize: 'smaller',
            textAlign: 'center',
            borderLeftWidth: 0,
            borderRightWidth: 0,
          }} value={this.typedAddress} placeholder={this.locationString} />
        <div className="map-div" ref={(e) => this.mapDiv = e} style={{
          flexGrow: 1,
          pointerEvents: this.selectedLocation ? 'auto' : 'none'
        }}>Map</div>
        {/*<section>
          NOTE: We use onMouseDown for the first button because it arrives before onBlur, which causes the button to swap to
          the confirmLocation button before we have a chance to handle the event.
          {this.inputFocused
            ? <a className="button" disabled={this.waitingForGeocoding} onMouseDown={(e) => this.findManuallyEnteredAddress()}>Find Address</a>
            : <a className="button" disabled={this.waitingForGeocoding} onClick={(e) => this.confirmLocation()}>Confirm Location</a>}
        </section>*/}
      </PageContent>
    </Page>;
  }
}
