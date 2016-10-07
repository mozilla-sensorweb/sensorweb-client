import React from 'react';

export function AllowLocationPage() {
  return <div></div>;
}

// import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
// import './assets/leaflet.css';

// import Leaflet from 'leaflet';
// (Leaflet.Icon.Default as any).prototype.options.imagePath = 'leaflet-images/';
// import './assets/images/marker-icon-2x.png';
// import './assets/images/marker-shadow.png';


// import 'leaflet-rotatedmarker';

// interface Location {
//   latitude: number;
//   longitude: number;
// }


// interface AllowLocationPageProps {
//   nav: NavigationState;
//   onLocationSelected(location: Location): void;
// }

// @observer
// class AllowLocationPage extends React.Component<AllowLocationPageProps, {}> {
//   @observable location: Location | undefined;

//   allowLocation() {
//     return new Promise((resolve, reject) => {
//       navigator.geolocation.getCurrentPosition(resolve, reject, {
//         enableHighAccuracy: true,
//         maximumAge: 10000,
//         timeout: 10000
//       });
//     }).then((location: any) => {
//       console.log('Locationffff: ' + location.coords.latitude + ' ' + location.coords.longitude + ' ' + location.coords.heading);
//       this.location = { latitude: location.coords.latitude, longitude: location.coords.longitude };
//     })
//   }

//   confirmLocation() {
//     this.location && this.props.onLocationSelected(this.location);
//   }

//   render() {
//     if (!this.location) {
//       return <Page nav={this.props.nav}>
//         <h1>Finding Your Location</h1>
//         <p>Now that your sensor is connected to WiFi, we need to learn a bit more about where your sensor is located.</p>
//         <p>This information will be used [in various ways, but not bad ways].</p>
//         <button onClick={this.allowLocation.bind(this)}>Allow Location</button>
//       </Page>;
//     }

//     const position = [this.location.latitude, this.location.longitude];
//     return <Page nav={this.props.nav}>
//       <Map center={position} zoom={17} style={{height: '100vh', position: 'absolute', top: '0', left: '0', width: '100%', zIndex: '-1' }}>
//         <TileLayer
//           url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
//           attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//         />
//         <Marker position={position}>
//           <Popup>
//             <span>A pretty CSS3 popup.<br/>Easily customizable.</span>
//           </Popup>
//         </Marker>
//       </Map>
//       <h1>Select Location</h1>
//       <button onClick={(e) => this.confirmLocation()} style={{position: 'absolute', bottom: '1rem', left: '1rem', width: 'calc(100% - 2rem)'}}>Confirm Location</button>
//     </Page>;
//   }
// }
