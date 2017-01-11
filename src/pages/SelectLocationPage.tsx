import React from 'react';
import { observable, when, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { Page, PageHeader, PageContent, Section } from '../ui';
import { NavigationState } from '../state';
import { debounce, Cancelable } from 'lodash';

import NetConnectionModal from './NetConnectionModal';

const MAPS_API_KEY = 'AIzaSyA_QULMpHLgnha_jMe-Ie-DancN1Bz4uEE';

class GoogleMapsLoader {
  @observable loaded: boolean = false;
  readonly scriptSrc: string;
  private timeoutId: number;

  constructor(apiKey: string) {
    const CALLBACK_NAME = 'initMap';
    (window as any)[CALLBACK_NAME] = this.onMapsReady.bind(this);
    this.scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${CALLBACK_NAME}`;
    this.attemptLoad();
  }

  attemptLoad() {
    console.log('attempting load');
    let script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = this.scriptSrc;
    script.onerror = this.onScriptError.bind(this);
    this.timeoutId = setTimeout(this.onScriptError.bind(this), 5000);
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  private finishLoad() {
    clearTimeout(this.timeoutId);
  }

  onScriptError(e: any) {
    this.finishLoad();
    console.log('onScriptError', e)
    setTimeout(() => {
      this.attemptLoad();
    }, 1000);
  }

  onMapsReady() {
    this.finishLoad();
    console.log('onMapsReady');
    this.loaded = true;
  }
}

export let googleMapsLoader = new GoogleMapsLoader(MAPS_API_KEY);

type Disposable = (() => void) | google.maps.MapsEventListener | Cancelable;

const DEFAULT_ZOOM = 18;

interface SelectLocationPageProps {
  nav: NavigationState;
  location?: google.maps.LatLng;
  saveLocation(location: google.maps.LatLng): void;
}

@observer
export default class SelectLocationPage extends React.Component<SelectLocationPageProps, {}> {
  map: google.maps.Map;
  mapDiv: HTMLElement;
  pin: HTMLDivElement;
  gpsControl: HTMLElement;
  addressInput: HTMLInputElement;
  disposers: Disposable[] = [];
  @observable waitingForFirstGpsResult: boolean = true;
  @observable locationString: string = '';
  @observable typedAddress: string = '';
  @observable inputFocused: boolean = false;
  @observable waitingForGeocoding: boolean = false;
  @observable currentGpsLocation?: google.maps.LatLng;
  @observable didSelectLocation: boolean = false;


  componentDidMount() {
    if (this.props.location) {
      this.selectLocation(this.props.location);
    }

    this.disposers.push(when(() => googleMapsLoader.loaded, () => {
      // Timeout required to allow page transition animation to complete properly...
      setTimeout(() => {
        this.loadMap();
      }, 0);
    }));
  }

  get isCurrentlyTrackingGps() {
    return this.currentGpsLocation && this.map &&
      this.currentGpsLocation.equals(this.getWrappedCenter());
  }

  selectLocation(location: google.maps.LatLng) {
    this.didSelectLocation = true;
    this.locationString = '';
    if (this.map) {
      this.map.panTo(location);
      this.map.setZoom(DEFAULT_ZOOM);
      this.map.setOptions({ zoomControl: true });
      this.pin.style.visibility = 'visible';
    }
  }

  loadMap() {
    if (!this.mapDiv) { throw new Error('Invariant: this.mapDiv must be set.'); }

    let initialLocation = this.props.location || this.currentGpsLocation;

    this.map = new google.maps.Map(this.mapDiv, {
      backgroundColor: 'rgb(163, 204, 255)',
      center: initialLocation || { lat: 0, lng: 100 },
      zoom: initialLocation ? DEFAULT_ZOOM : 1,
      disableDefaultUI: true,
      zoomControl: this.props.location ? true : false,
      clickableIcons: false,
    });

    this.pin = document.createElement('div');
    this.pin.classList.add('gps-pin');
    this.pin.style.visibility = 'hidden';
    this.mapDiv.appendChild(this.pin);

    if (initialLocation) {
      // Ensure the pin gets visible etc
      this.selectLocation(initialLocation);
    }

    this.gpsControl = document.createElement('div');
    let controlText = document.createElement('img');
    this.gpsControl.classList.add('gps-control');
    controlText.src = require<string>('../assets/gps-pointer.svg');
    this.gpsControl.appendChild(controlText);
    this.gpsControl.onclick = (e) => {
      this.currentGpsLocation && this.selectLocation(this.currentGpsLocation);
    };
    this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.gpsControl);

    // google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
    //   this.loading = false;
    // });

    this.disposers.push(this.map.addListener('click', () => {
      this.addressInput.blur();
    }));

    let centerChangedHandler = debounce(this.onMapCenterChanged.bind(this), 500);
    this.disposers.push(centerChangedHandler);

    // set location ---> center_changed --> set location
    this.disposers.push(this.map.addListener('center_changed', centerChangedHandler));
    this.onMapCenterChanged();

    // When the keyboard pops up, recenter the map on the proper address.
    let resizeHandler = () => {
      google.maps.event.trigger(this.map, 'resize');
    };
    addEventListener('resize', resizeHandler);
    this.disposers.push(() => {
      removeEventListener('resize', resizeHandler);
    });

    this.trackPosition();
  }

  trackPosition() {
    // If we're already tracking the current GPS location, move it to match.
    let watchPositionId = navigator.geolocation.watchPosition((location) => {
      this.waitingForFirstGpsResult = false;
      this.currentGpsLocation = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
      if (this.isCurrentlyTrackingGps || !this.didSelectLocation) {
        this.selectLocation(this.currentGpsLocation);
      }
    }, (err: any) => {
      this.waitingForFirstGpsResult = false;
      console.error(err, err.code, err.message); // XXX display error
      //if (err.code !== 3 /* timeout */) {
        // We'll want them to try to enter their address (wait for the page transition first)
        if (!this.didSelectLocation) {
          setTimeout(() => {
            this.addressInput.focus();
          }, 500);
        }
      //}
    }, {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 5000
      });
    this.disposers.push(() => navigator.geolocation.clearWatch(watchPositionId));
  }

  getWrappedCenter(): google.maps.LatLng {
    // getCenter() doesn't wrap by default, meaning it can return values greater than 180.
    // We can normalize it like so:
    let center = this.map.getCenter();
    return new google.maps.LatLng(center.lat(), center.lng());
  }

  /**
   * When the location changes (with a debounced timeout to prevent overloading geocoding limits),
   * run the geocoder to populate the address field.
   */
  onMapCenterChanged() {
    this.gpsControl.classList.toggle('following', this.isCurrentlyTrackingGps);
    this.gpsControl.style.display = (this.currentGpsLocation ? '' : 'none');

    if (this.inputFocused || !this.didSelectLocation) {
      return;
    }

    console.log('Geocoding:', this.getWrappedCenter().toString());
    let geo = new google.maps.Geocoder();
    geo.geocode({
      location: this.getWrappedCenter()
    }, (results, status) => {
      console.log('Geocode result:', status, results && results[0]);
      if (results && results[0]) {
        this.locationString = results[0].formatted_address;
      }
    });
  }

  componentDidUpdate() {
    if (this.map) {
      // If components changed position, the map might have resized (due to flexbox).
      // We need to tell google, because it doesn't automatically detect that resize.
      google.maps.event.trigger(this.map, 'resize');
    }
  }

  componentWillUnmount() {
    this.disposers.forEach((disposer) => {
      if ((disposer as Cancelable).cancel) {
        (disposer as Cancelable).cancel();
      } else if (typeof disposer === 'function') {
        disposer();
      } else if ((disposer as google.maps.MapsEventListener)) {
        (disposer as google.maps.MapsEventListener).remove();
      }
    });
    (window as any).initMap = () => { };
  }

  submit() {
    if (this.didSelectLocation) {
      let center = this.getWrappedCenter();
      console.log('Selected location:', center.toString());
      this.props.saveLocation(center);
      this.props.nav.markComplete();
    }
  }

  findManuallyEnteredAddress() {
    if (!this.typedAddress) {
      return;
    }
    let geo = new google.maps.Geocoder();
    this.waitingForGeocoding = true;
    geo.geocode({
      address: this.typedAddress
    }, (results, status) => {
      this.waitingForGeocoding = false;
      // XXX if no address, handle error (maybe clear input?)
      if (!results || !results[0]) {
        console.log('unable to geocode: ' + status);
        this.addressInput.blur();
        return;
      }
      runInAction(() => {
        this.selectLocation(results[0].geometry.location);
        this.locationString = results[0].formatted_address;
        this.typedAddress = '';
      });
    });
  }

  render() {
    return <Page loading={this.waitingForFirstGpsResult}>
      <NetConnectionModal nav={this.props.nav} visible={!googleMapsLoader.loaded} />
      <PageHeader nav={this.props.nav} title="Where is your sensor?"
        next={!this.waitingForGeocoding && !this.inputFocused && this.didSelectLocation && (() => this.submit())} />
      <PageContent>
        <Section>
          {this.waitingForFirstGpsResult
            ? <p>Finding your location...</p> // loading
            : this.didSelectLocation ?
              <p>Drag the map to adjust.</p> : <p>Please type your address. We couldn’t find your location automatically.</p>}
        </Section>
        <input type="text"
          ref={(el) => this.addressInput = el}
          disabled={this.waitingForGeocoding}
          onChange={(e) => this.typedAddress = e.currentTarget.value}
          onKeyDown={(e) => { if (e.keyCode === 13) e.currentTarget.blur(); } }
          onFocus={(e) => this.inputFocused = true}
          onBlur={(e) => { this.inputFocused = false; this.findManuallyEnteredAddress(); } }
          onClick={(e) => e.currentTarget.select()}
          style={{
            fontSize: 'smaller',
            textAlign: 'center',
            borderLeftWidth: 0,
            borderRightWidth: 0,
          }} value={this.typedAddress || (!this.inputFocused && this.locationString) || ''} />
        <div className="map-div" ref={(e) => this.mapDiv = e} style={{
          flexGrow: 1,
          pointerEvents: this.didSelectLocation ? 'auto' : 'none'
        }}>Map</div>
      </PageContent>
    </Page>;
  }
}
