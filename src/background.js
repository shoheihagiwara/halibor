'use strict'

import clipboardListener from 'clipboard-event';
import { app, BrowserWindow, clipboard, ipcMain } from 'electron';
import ioHook from 'iohook';
import sqlite3 from 'sqlite3';
import path from 'path';

sqlite3.verbose();

const appDataDirPath = app.getPath('userData');

const db = new sqlite3.Database(path.join(appDataDirPath, 'sqlite.db'), error => {
  if (error !== null) {
    console.log(error);
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS clipboard (id TIMESTAMP PRIMARY KEY DEFAULT CURRENT_TIMESTAMP, text TEXT NOT NULL);');
});

const keyCodeCtrl = 29;

// start listening on clipboard
clipboardListener.startListening();

// when clipboard is changed, add clipboard content to DB
// But if the content is the same as the newest content in DB, do not add.
clipboardListener.on('change', () => {
  console.log('Clipboard changed');
  let content = clipboard.readText();
  console.log("content: ", content);
  let sql = 
    `INSERT INTO clipboard(text) 
     SELECT text
     FROM (SELECT ? AS text) AS temp
     WHERE temp.text <> (SELECT text FROM clipboard ORDER BY id DESC LIMIT 1);`;
  console.log("SQL: ", sql);

  db.run(sql, content, (error) => {
    if (error === null) return;
    console.log("error: ", error);
  });
  console.log("insert done.");

});


// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow = null;

let ctrlPressedLast = null;
let ctrlReleasedLast = null;

ioHook.on('keyup', event => {
  console.log(Date.now(), event);
  
  if (event.keycode === keyCodeCtrl) {
    ctrlReleasedLast = Date.now();
  }
});

ioHook.on('keydown', event => {
  console.log(Date.now(), event);

  // if ctrl pressed twice and window is not showing , create window
  if (event.keycode === keyCodeCtrl) {
    let ctrlPressedNow = Date.now();
    let sinceCtrlPressedLast = ctrlPressedNow - ctrlPressedLast;
    let sinceCtrlReleasedLast = ctrlPressedNow - ctrlReleasedLast;
    
    // only show when pressed twice quickly (<300ms)
    if (sinceCtrlPressedLast  < 300 &&
        sinceCtrlReleasedLast < 300) {
      createWindowIfNotExists();
    }

    ctrlPressedLast = ctrlPressedNow;
  }
});

// Register and start hook
ioHook.start();

function createWindowIfNotExists() {

  if (mainWindow !== null) {
    return;
  }

  // select data to show in window
  let listOfItemsToShow = null;
  db.serialize(() => {
    db.all("SELECT text FROM clipboard ORDER BY id DESC;", (error, rows) => {

      // on error
      if (error !== null) {
        console.log("errors in selecting: ", errors);
        return;
      }

      // if no error, show clipboard history content
      console.log("selected rows: ", rows);

      listOfItemsToShow = rows.map(val => val.text);
    })
  });

  // create a new windows
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
  })


  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  console.log("__dirnmae: ", __dirname);

  // send list to the windows
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('list', listOfItemsToShow);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log("failed loading: ", event, errorCode, errorDescription);
  });


  mainWindow.on('closed', (e) => {
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
app.on('window-all-closed', () => {
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    createWindowIfNotExists();
  }
})

ipcMain.on('close', (event, arg) => {
  mainWindow.close();
});