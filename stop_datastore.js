const datastore = require('@google-cloud/datastore');
const Emulator = require('google-datastore-emulator');
 
 
    let emulator;
    
        emulator = new Emulator({});
        
        emulator.stop();
 
