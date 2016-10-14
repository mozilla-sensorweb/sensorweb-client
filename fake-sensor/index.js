const bleno = require('bleno');

console.log('bleno - echo');

function makeCharacteristic(uuid, cb) {
   let char = new bleno.Characteristic({
    uuid: uuid,
    properties: ['read', 'write', 'writeWithoutResponse'],
    value: null,
    onWriteRequest: function (data, offset, withoutResponse, callback) {
      char.value = data;
      console.log('WRITE:', uuid, data.toString('utf-8'), offset, data.length, withoutResponse);
      cb && cb();
      callback(this.RESULT_SUCCESS);
    }
  });
  char.value = new Buffer(0);
  return char;
}

let ssid1 = makeCharacteristic('ffe1');
let ssid2 = makeCharacteristic('ffe2');
let ssidEOF = makeCharacteristic('ffe3');
let password1 = makeCharacteristic('fff1');
let password2 = makeCharacteristic('fff2');
let password3 = makeCharacteristic('fff3');
let password4 = makeCharacteristic('fff4');
let wifiEOF = makeCharacteristic('fff5', () => {
  let ssidLen = parseInt(ssidEOF.value.toString('utf-8'));
  let passwordLen = parseInt(wifiEOF.value.toString('utf-8'));
  console.log('Got WiFi',
    Buffer.concat([ssid1.value, ssid2.value]).slice(0, ssidLen).toString('utf-8'),
    Buffer.concat([password1.value, password2.value, password3.value, password4.value]).slice(0, passwordLen).toString('utf-8'));
});



bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('echo', ['ec00']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new bleno.PrimaryService({
        uuid: 'ec00',
        characteristics: [
          ssid1,
          ssid2,
          ssidEOF,
          password1,
          password2,
          password3,
          password4,
          wifiEOF
        ]
      })
    ]);
  }
});