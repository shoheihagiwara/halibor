/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/background.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/background.js":
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var clipboard_event__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! clipboard-event */ "clipboard-event");
/* harmony import */ var clipboard_event__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(clipboard_event__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var iohook__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! iohook */ "iohook");
/* harmony import */ var iohook__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(iohook__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var sqlite3__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! sqlite3 */ "sqlite3");
/* harmony import */ var sqlite3__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(sqlite3__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_4__);







sqlite3__WEBPACK_IMPORTED_MODULE_3___default.a.verbose();
const appDataDirPath = electron__WEBPACK_IMPORTED_MODULE_1__["app"].getPath('userData');
const db = new sqlite3__WEBPACK_IMPORTED_MODULE_3___default.a.Database(path__WEBPACK_IMPORTED_MODULE_4___default.a.join(appDataDirPath, 'sqlite.db'), error => {
  if (error !== null) {
    console.log(error);
  }
});
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS clipboard (id TIMESTAMP PRIMARY KEY DEFAULT CURRENT_TIMESTAMP, text TEXT NOT NULL);');
});
const keyCodeCtrl = 29; // start listening on clipboard

clipboard_event__WEBPACK_IMPORTED_MODULE_0___default.a.startListening(); // when clipboard is changed, add last item to DB

clipboard_event__WEBPACK_IMPORTED_MODULE_0___default.a.on('change', () => {
  console.log('Clipboard changed');
  let content = electron__WEBPACK_IMPORTED_MODULE_1__["clipboard"].readText();
  console.log("content: ", content);
  let sql = `INSERT INTO clipboard (text) VALUES (?);`;
  console.log("SQL: ", sql);
  db.run(sql, content, error => {
    if (error === null) return;
    console.log("error: ", error);
  });
  console.log("insert done.");
}); // global reference to mainWindow (necessary to prevent window from being garbage collected)

let mainWindow = null;
let ctrlPressedLast = null;
let ctrlReleasedLast = null;
iohook__WEBPACK_IMPORTED_MODULE_2___default.a.on('keyup', event => {
  console.log(Date.now(), event);

  if (event.keycode === keyCodeCtrl) {
    ctrlReleasedLast = Date.now();
  }
});
iohook__WEBPACK_IMPORTED_MODULE_2___default.a.on('keydown', event => {
  console.log(Date.now(), event); // if ctrl pressed twice and window is not showing , create window

  if (event.keycode === keyCodeCtrl) {
    let ctrlPressedNow = Date.now();
    let sinceCtrlPressedLast = ctrlPressedNow - ctrlPressedLast;
    let sinceCtrlReleasedLast = ctrlPressedNow - ctrlReleasedLast; // only show when pressed twice quickly (<300ms)

    if (sinceCtrlPressedLast < 300 && sinceCtrlReleasedLast < 300) {
      createWindowIfNotExists();
    }

    ctrlPressedLast = ctrlPressedNow;
  }
}); // Register and start hook

iohook__WEBPACK_IMPORTED_MODULE_2___default.a.start();

function createWindowIfNotExists() {
  if (mainWindow !== null) {
    return;
  } // select data to show in window


  let listOfItemsToShow = null;
  db.serialize(() => {
    db.all("SELECT text FROM clipboard ORDER BY id DESC;", (error, rows) => {
      // on error
      if (error !== null) {
        console.log("errors in selecting: ", errors);
        return;
      } // if no error, show clipboard history content


      console.log("selected rows: ", rows);
      listOfItemsToShow = rows.map(val => val.text);
    });
  }); // create a new windows

  mainWindow = new electron__WEBPACK_IMPORTED_MODULE_1__["BrowserWindow"]({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false
  }); // and load the index.html of the app.

  mainWindow.loadFile(path__WEBPACK_IMPORTED_MODULE_4___default.a.join(__dirname, 'index.html'));
  console.log("__dirnmae: ", __dirname); // send list to the windows

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('list', listOfItemsToShow);
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log("failed loading: ", event, errorCode, errorDescription);
  });
  mainWindow.on('closed', e => {
    console.log('event closed emitted.');
    mainWindow = null;
  });
  mainWindow.on('blur', () => {
    console.log('event blur emitted.');
    mainWindow.close();
  });
}
/* function createMainWindow() {
  const window = new BrowserWindow({ webPreferences: { nodeIntegration: true } })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
} */
// keep app running even if all windows are closed.


electron__WEBPACK_IMPORTED_MODULE_1__["app"].on('window-all-closed', () => {});
electron__WEBPACK_IMPORTED_MODULE_1__["app"].on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    createWindowIfNotExists();
  }
});
electron__WEBPACK_IMPORTED_MODULE_1__["ipcMain"].on('close', (event, arg) => {
  mainWindow.close();
});

/***/ }),

/***/ "clipboard-event":
/*!**********************************!*\
  !*** external "clipboard-event" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("clipboard-event");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),

/***/ "iohook":
/*!*************************!*\
  !*** external "iohook" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("iohook");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "sqlite3":
/*!**************************!*\
  !*** external "sqlite3" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("sqlite3");

/***/ })

/******/ });
//# sourceMappingURL=background.js.map