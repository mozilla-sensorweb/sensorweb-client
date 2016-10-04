const bleno = require('bleno');

console.log('bleno - echo');

let writeCharacteristic = new bleno.Characteristic({
  uuid: 'fff1',
  properties: ['read', 'write', 'writeWithoutResponse'],
  value: null,
  onWriteRequest: function (data, offset, withoutResponse, callback) {
    console.log('WRITE:', data.toString('ascii'), offset, withoutResponse);
    callback(this.RESULT_SUCCESS);
  }
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
          writeCharacteristic
        ]
      })
    ]);
  }
});