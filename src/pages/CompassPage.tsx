import React from 'react';
import { Page, PageHeader, PageContent } from '../ui';
import { NavigationState } from '../state';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

interface CompassPageProps {
  nav: NavigationState;
  location: google.maps.LatLng;
  saveCompassDirection(direction: number): void;
}

let STATIC_MAPS_API_KEY = 'AIzaSyAzdnYcY71seAeev_Damc1I-FUClkE5_-Q';

let STATIC_MAP_BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap?';

let FakeCompass = {
  watchHeading(cb: any, errback: any, params: any): number {
    return setInterval(() => {
      cb({ magneticHeading: Date.now() / 50 % 360 });
    }, 100);
  },
  clearWatch(id: number): void {
    clearInterval(id);
  }
};

function toCardinalDirection(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.floor((degrees / (360 / directions.length)) + 0.5) % directions.length];
}

@observer
export default class CompassPage extends React.Component<CompassPageProps, {}> {
  @observable watchId: any;
  @observable currentHeading: number = 0;
  @observable showManualPopup: boolean = false;
  compass: any = (navigator as any).compass || FakeCompass;
  mapUrl: string;

  componentWillMount() {
    this.mapUrl = this.getStaticMapUrl();
  }

  getStaticMapUrl() {
    let loc = this.props.location;
    let params: any = {
      center: loc.lat() + ',' + loc.lng(),
      zoom: 19,
      size: document.body.clientWidth + 'x' + document.body.clientWidth,
      scale: 2, // higher-resolution
      key: STATIC_MAPS_API_KEY,
      //signature: '' // XXX : should get a signature for APIs
      style: [
        'element:labels|visibility:off'
      ]
    };

    return STATIC_MAP_BASE_URL + Object.keys(params).map((key) => {
      let values: any = params[key];
      if (!Array.isArray(params[key])) {
        values = [values];
      }
      return values.map((value: any) => key + '=' + encodeURIComponent(value)).join('&');
    }).join('&');
  }

  componentDidMount() {
    this.watchId = this.compass.watchHeading((heading: any) => {
      this.currentHeading = heading.magneticHeading;
    }, (err: any) => {
      console.error('Failed to watch compass:', err);
      this.compass.clearWatch(this.watchId);
      this.showManualPopup = true;
    }, {
      frequency: 50
    });
  }

  componentWillUnmount() {
    this.compass.clearWatch(this.watchId);
  }

  confirmAutomaticDirection() {
    this.props.saveCompassDirection(this.currentHeading);
    this.props.nav.markComplete();
  }

  confirmManualDirection(degrees: number) {
    this.showManualPopup = false;
    this.props.saveCompassDirection(degrees);
    this.props.nav.markComplete();
  }

  render() {
    let manualPopup: any = null;

    if (this.showManualPopup) {
      manualPopup = <div className="modal-popup" onClick={(e) => {
        if (e.target === e.currentTarget) {
          this.showManualPopup = false;
        }
      }}>
        <div className="manual-direction-entry">
          <ul className="list">
            <li className="list-item-header">Select Direction</li>
            <li onClick={() => this.confirmManualDirection(0)}>North</li>
            <li onClick={() => this.confirmManualDirection(90)}>East</li>
            <li onClick={() => this.confirmManualDirection(180)}>South</li>
            <li onClick={() => this.confirmManualDirection(270)}>West</li>
          </ul>
        </div>
      </div>;
    }

    return <Page>
       {manualPopup}
      <PageHeader nav={this.props.nav} title='Which side of the building?'
        next={this.confirmAutomaticDirection.bind(this)} />
      <PageContent>
        <section className="instruction">
          <p>Hold your phone so that it points <em>away</em> from your house, toward the outdoors.</p>
          <p className="detail">Or <a href="#" onClick={() => this.showManualPopup = true }>manually enter your direction</a>.</p>
        </section>
        <div style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: '1 1 0px',
          overflow: 'hidden'
         }}>
          <img style={{width: '100%', height: 'auto', display: 'block'}} src={this.mapUrl} />
          <img className='compass-pointer'
            style={{transform: `rotate(${this.currentHeading}deg)`}}
            src={require<string>('../assets/compass-pointer.svg')} />
        </div>
        {/*<section>
          <a className="button" onClick={(e) => this.confirmAutomaticDirection()}>Confirm Direction</a>
        </section>*/}
      </PageContent>
    </Page>;
  }
}