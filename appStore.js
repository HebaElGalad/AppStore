const verification = {
  isString(inputString){
    if (typeof inputString != 'string') {
    throw new Error ('The input must be ONLY a string');
    }
  },
  isRegex(inputString) {
    const regExp = /^([a-zA-Z0-9\s]){1-24}$/;
      if ( regExp.test(inputString.trim()) === false ) {
      throw new Error ('Enter app name not more than 24 character contains latin letters, numbers and whitespace ONLY');
      }
    },
  isNumber(inputNum) {
    if(isNaN(inputNum)) {
    throw new Error ('Please enter a number');
    }
  },
  isPositive(inputNum) {
    if(inputNum < 0) {
    throw new Error ('Please enter a positive number');
    }
  },
  isMaximunTen(inputNum) {
    if( !(inputNum > 0 && inputNum < 11) ) {
      throw new Error ('Please enter a number between 0 and 10');
    }
  },
  isUndefined(inputValue) {
    if( !inputValue) {
      throw new Error ('The new version is undefined.'); 
    }
  }
};

function testNameValue (name) {
  verification.isString(name);
  verification.isRegex(name);
}

function testDescriptionValue (description) {
  verification.isString(description);
}

function testVersionValue (version) {
  verification.isNumber(version);
  verification.isPositive(version);
}

function testRatingValue (rating) {
  verification.isNumber(rating);
  verification.isMaximunTen(rating);
}

function testReleaseVersion (ratingVersion) {
  verification.isUndefined(ratingVersion);
  verification.isNumber(ratingVersion);
  verification.isPositive(ratingVersion);
}

function testDeviceName (name) {
  verification.isString(name);
  if ( !(name.length > 0 && name.length < 33) ) {
    throw new Error ('Enter device name not more than 32 character');
  }
}

function testDeviceApps (arr) {
  arr.forEach( app => {
    if( !(app instanceof App) ) {
      throw new Error ('App in invalid');
    }
  });
}

class  App {
  constructor(config) {
    testNameValue(config.name);
    testDescriptionValue(config.description);
    testVersionValue(config.version);
    testRatingValue(config.rating);

    this.name = config.name;
    this.description = config.description;
    this.version = config.version;
    this.rating = config.rating;
  }

  release(options) {
    testReleaseVersion(options.version);
    // check if the entered version of the app is lower than the existing one
    if ( this.version < options.version ) {
      throw new Error ('The entered version is lower than the existing one.Please enter a newer version');
    }
    // changes the version of the app
    this.version = options.version;

    if ( options.hasOwnProperty('description') ) {
      testDescriptionValue (options.description);
      this.description = options.description;
    }

    if ( options.hasOwnProperty('rating') ) {
      testRatingValue (options.rating);
      this.rating = options.rating;
    }
  }
}

class Store extends App {
  constructor(config) {
    super(config);
    this.apps = [];
  }

  uploadApp(testedApp) {
    // check if the app does exist then update it to the newer version
    // if doesn't exist create a new one
    if (testedApp instanceof App) {
      let index = this.apps.findIndex( app => app.name == testedApp );
      if ( index >= 0 ) {
        if ( testVersionValue(apps[index][version]) ) {
          apps[index][version] = testedApp.version;
          apps[index][description] = testedApp.description;
          apps[index][rating] = testedApp.rating;
        }
      } else {
        this.apps.push(testedApp);
      }
    }
  }

  takedownApp(givenName) {
    // removes an app with the given name from the store
    let index = this.apps.findIndex( app => app.name == givenName);
    if (index >= 0) {
      this.apps.splice( index, 1 );
    } else {
      throw new Error ('This app does not exist!');
    }
    // 
  }

  search(pattern) {
    // performs "case-insensitive" search in the store
    // returns an array of apps containing 'pattern' in their name
    // sort apps lexicographically by name
    let searchResultApps = this.apps.filter(app => {
      if( app.name.toLowerCase().includes(pattern.toLowerCase()) ) { return true; }
    });
    
    searchResultApps.sort((a, b) => a.name.localeCompare(b.name));
    return searchResultApps;
  }

  listMostRecentApps(count = 10) {
    // array of the 'count' most recent apps sorted by time of upload descending
    let recentApps = this.apps.slice( -count).reverse();
    return recentApps;
  }

  listMostPopularApps(count = 10) {
    // array of the 'count' most popular apps sorted by rating descendings
    // apps with equal rating should be sorted by time of upload descending
    const storeApps = [...this.apps];
    const popularApps = [];
    const iteratorLength = storeApps.length > count ? count : storeApps.length;
    for (let index = 1; index < iteratorLength + 1 ; index++) {
      const highest = storeApps.reduce( (prev, current) => prev.rating > current.rating ? prev : current );
      popularApps.push(highest);
      storeApps.splice( storeApps.indexOf(highest), 1 );
    }
    return popularApps;
  }
}

class Device {
  constructor(hostname, apps) {
    testDeviceName(hostname);
    testDeviceApps(apps);
    this.hostname = hostname;
    this.apps = apps;

    // Stores array is an array of installed app stores. It should result from an
    // operation on apps array
    this.stores = this.apps.filter(app => app instanceof Store ? true : false);
  }

  search(pattern) {
    // performs "case-insensitive" search in all stores installed on the device
    // returns an array of apps containing 'pattern' in their name
    // sort apps lexicographically by name
    // return only latest versions of apps if they are available in multiple stores with different versions
    let findMatch = [];
    for (const store in this.stores) {
      this.stores[store].apps.forEach( app => {
        if (app.name.toLowerCase().includes( pattern.toLowerCase())) {
          findMatch.push(app);
        }
      });
    }
    findMatch.sort((a, b) => a.name.localeCompare(b.name));

    function compareApps (prevObj) {
      // remove first element from findMatch array
      findMatch.shift();
      return findMatch.filter(currentObj => {
        if (prevObj.name === currentObj.name) {
          (prevObj.version > currentObj.version) ? prevObj : currentObj;
        }
      });
    }
    const searchResultApps = findMatch.filter(compareApps);
    return searchResultApps;
  }

  install(givenName) {
    // does nothing if the app is already installed
    // find the most recent version of the app in the installed stores
    // throws if app name is not available in installed stores
    let findOnDevice = this.apps.findIndex( app => app.name.toLowerCase().includes(givenName.toLowerCase()) );
    let findOnStores = this.search(givenName);

    if ( findOnDevice < 0 ) {
      if ( findOnStores.length == 0 ) {
        throw new Error('There is no such an app');
      } 
    }
    this.apps.push(findOnStores[0]);
  }

  uninstall(givenName) {
    // uninstall an app with the given name from the device
    let index = this.apps.findIndex( app => app.name.toLowerCase().includes(givenName.toLowerCase()) );
    if (index < 0) {
      throw new Error ('This app does not exist!');
    } 
    let removed = this.apps.splice( index, 1 );
    console.log(removed[0].name, 'is uninstalled successfully');
  }

  listInstalled() {
    // returns an array of all installed apps sorted lexicographically by name
    return installedApps = this.apps.sort((a, b) => a.name.localeCompare(b.name));
  }

  update() {
    // updates all installed apps to their latest version across all stores
    // installed on the device

    // Filter DEVICE APPS array and return only apps
    const appsOnly = this.apps.filter(app => {
      if (!(app instanceof Store)) { return app; }
    });
    let deviceUpdatedApps = [];
    appsOnly.forEach( app => {
        let appOnDevice = app;
        this.stores.forEach( (currentStore) => {
          let updatedApp = currentStore.apps.find( ({name, version}) => {
            return (name == appOnDevice.name && version > appOnDevice.version);
          });
          if (updatedApp != undefined) {
            appOnDevice = updatedApp;
            deviceUpdatedApps.push(appOnDevice);
          }
        });
    });
    return (deviceUpdatedApps);
  }
}


const playStore = new App({name: 'Play Store', description: 'New App', version: 3, rating: 6});
// 

const googlePlayStore = new Store ({name: 'Google Play Store', description: 'New App', version: 7.8, rating: 8.3});

const appleStore = new Store ({name: 'Apple Store', description: 'Store Apps', version: 60.5, rating: 8.9});

// GOOGLE PLAY STORE APPS
const linkedin = new App ({name: 'LinkedIn', description: 'New App', version: 7.8, rating: 8.3});
googlePlayStore.uploadApp(linkedin);

const facebook = new App ({name: 'Facebook', description: 'Social media app', version: 23, rating: 8.3});
googlePlayStore.uploadApp(facebook);

const googleMaps = new App ({name: 'Google Maps', description: 'Navigation app', version: 18, rating: 9});
googlePlayStore.uploadApp(googleMaps);

const whatsApp = new App ({name: 'WhatsApp', description: 'Communication app', version: 11.2, rating: 8.7});
googlePlayStore.uploadApp(whatsApp);

const googleChrome = new App ({name: 'Google Chrome', description: 'Browser app', version: 66, rating: 9.3});
googlePlayStore.uploadApp(googleChrome);

const googleDrive = new App ({name: 'Google Drive', description: 'Online storage app', version: 15, rating: 9.1});
googlePlayStore.uploadApp(googleDrive);

const mozillaFirefox = new App ({name: 'Mozilla Firefox', description: 'Browser app', version: 59, rating: 8.8});
googlePlayStore.uploadApp(mozillaFirefox);

const instagram = new App ({name: 'Instagram', description: 'Media app', version: 45, rating: 8.9});
googlePlayStore.uploadApp(instagram);

const messenger = new App ({name: 'Messenger', description: 'Chating app', version: 47, rating: 8.5});
googlePlayStore.uploadApp(messenger);

const soundCloud = new App ({name: 'SoundCloud', description: 'Music and audio app', version: 38, rating: 8.7});
googlePlayStore.uploadApp(soundCloud);

// APPLE STORE APPS
const applelinkedin = new App ({name: 'LinkedIn', description: 'New App', version: 7.5, rating: 8.3});
appleStore.uploadApp(applelinkedin);

const applefacebook = new App ({name: 'Facebook', description: 'Social media app', version: 25, rating: 8.3});
appleStore.uploadApp(applefacebook);

const applegoogleMaps = new App ({name: 'Google Maps', description: 'Navigation app', version: 19, rating: 9});
appleStore.uploadApp(applegoogleMaps);

const applewhatsApp = new App ({name: 'WhatsApp', description: 'Communication app', version: 11, rating: 8.7});
appleStore.uploadApp(applewhatsApp);

const applegoogleChrome = new App ({name: 'Google Chrome', description: 'Browser app', version: 66.6, rating: 9.3});
appleStore.uploadApp(applegoogleChrome);

const applegoogleDrive = new App ({name: 'Google Drive', description: 'Online storage app', version: 14, rating: 9.1});
appleStore.uploadApp(applegoogleDrive);

const applemozillaFirefox = new App ({name: 'Mozilla Firefox', description: 'Browser app', version: 58, rating: 8.8});
appleStore.uploadApp(applemozillaFirefox);

const appleinstagram = new App ({name: 'Instagram', description: 'Media app', version: 47, rating: 8.9});
appleStore.uploadApp(appleinstagram);

const applemessenger = new App ({name: 'Messenger', description: 'Chating app', version: 46, rating: 8.5});
appleStore.uploadApp(applemessenger);

const applesoundCloud = new App ({name: 'SoundCloud', description: 'Music and audio app', version: 36, rating: 8.7});
appleStore.uploadApp(applesoundCloud);

const sonyApps = [googlePlayStore, appleStore, facebook, linkedin, whatsApp, googleChrome, googleMaps, instagram, messenger, soundCloud];
const sonyZX = new Device ("Sony ZX", sonyApps);

// console.log(googlePlayStore.apps);
// console.log(googlePlayStore.search('oo'));
// console.log(googlePlayStore.takedownApp('Facebook'));
// console.log(googlePlayStore.listMostRecentApps());
// console.log(googlePlayStore.listMostPopularApps());
// console.log(appleStore.apps);

// console.log(sonyZX.stores);
// console.log(sonyZX.apps);
// console.log(sonyZX.uninstall('Google Maps'));
// console.log(sonyZX.listInstalled());
// console.log(sonyZX.install('Drive'));
// console.log(sonyZX.search('oo'));
// console.log(sonyZX.update());
