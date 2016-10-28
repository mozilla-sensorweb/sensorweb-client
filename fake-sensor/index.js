const bleno = require('bleno');
let { Characteristic, Descriptor } = bleno;

const SERVICE_UUID = '0123';
let CHARS = {
  status: { uuid: '0000', properties: ['read'] },
  action: { uuid: '0001' },
  location: { uuid: '0002' },
  altitude: { uuid: '0003' },
  heading: { uuid: '0004' },
  ssid1: { uuid: '0005' },
  ssid2: { uuid: '0006' },
  ssidLength: { uuid: '0007' },
  password1: { uuid: '0008' },
  password2: { uuid: '0009' },
  password3: { uuid: '000a' },
  password4: { uuid: '000b' },
  passwordLength: { uuid: '000c' },
}

function logData() {
  let ssid = combineToString(CHARS.ssidLength, [CHARS.ssid1, CHARS.ssid2]);
  let password = combineToString(CHARS.passwordLength, [CHARS.password1, CHARS.password2, CHARS.password3, CHARS.password4]);
  let latitude = CHARS.location.buffer.readFloatBE(0);
  let longitude = CHARS.location.buffer.readFloatBE(4);
  let altitude = CHARS.altitude.buffer.readUInt32BE(0);
  let heading = CHARS.heading.buffer.readUInt32BE(0);
  console.log(`----------------------------`);
  console.log(`Wifi: ${ssid} / ${password}`);
  console.log(`Location: ${latitude}, ${longitude}`);
  console.log(`Altitude: ${altitude}`);
  console.log(`Heading: ${heading}`);
}

CHARS.action.onWrite = (buffer) => {
  logData();
  setStatus('setupComplete');
};

function setStatus(str) {
  CHARS.status.buffer = new Buffer(str, 'utf-8');
  let cb = CHARS.status.characteristic.updateValueCallback;
  if (cb) {
    console.log('calling back');
    cb(CHARS.status.buffer);
  }
}


let characteristics = Object.keys(CHARS).map((key) => {
  let info = CHARS[key];
  info.buffer = new Buffer(0);
  info.characteristic = new Characteristic({
    uuid: info.uuid,
    descriptors: [
      new Descriptor({ uuid: '2901', value: key }) // human-readable description
    ],
    properties: info.properties || ['read', 'write', 'writeWithoutResponse'],
    //secure: info.properties || ['read', 'write', 'writeWithoutResponse'],
    onReadRequest: (offset, callback) => {
      console.log('READ?', key, info.buffer);
      callback(Characteristic.RESULT_SUCCESS, info.buffer);
    },
    value: null,
    onWriteRequest: (data, offset, withoutResponse, callback) => {
      console.log("WRITE?", key, data, offset, withoutResponse);
      info.buffer = data;
      if (info.onWrite) {
        info.onWrite(info.buffer);
      }
      callback(Characteristic.RESULT_SUCCESS);
    },
  });
  return info.characteristic;
});



setStatus('needsSetup');




CHARS.status.characteristic.on('subscribe', () => {
  console.log('SOMEONE SUBSCRIBED');
})

function combineToString(cLength, cValues) {
  let length = cLength.buffer.readUInt32BE(0);
  let buffer = Buffer.concat(cValues.map((c) => c.buffer)).slice(0, length);
  return buffer.toString('utf-8');
}


bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('fakesensor', [SERVICE_UUID]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: SERVICE_UUID,
        characteristics: characteristics
      })
    ]);
  }
});