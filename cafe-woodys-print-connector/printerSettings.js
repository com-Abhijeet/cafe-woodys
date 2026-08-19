const Store = require('electron-store');
const store = new Store();

function getDefaultPrinter() {
  return store.get('selectedPrinter', null);
}

function setDefaultPrinter(printerName) {
  store.set('selectedPrinter', printerName);
  return printerName;
}

module.exports = {
  getDefaultPrinter,
  setDefaultPrinter
};
