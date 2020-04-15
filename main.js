// Modules to control application life and create native browser window
const { app, BrowserWindow, clipboard, ipcMain } = require('electron')
const ioHook = require('iohook');
const path = require('path');
const clipboardListener = require('clipboard-event');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS clipboard (id TIMESTAMP PRIMARY KEY DEFAULT CURRENT_TIMESTAMP, text TEXT NOT NULL);');
});

const keyCodeCtrl = 29;

// start listening on clipboard
clipboardListener.startListening();

// when clipboard is changed, add last item to DB
clipboardListener.on('change', () => {
  console.log('Clipboard changed');
  let content = clipboard.readText();
  console.log("content: ", content);
  let sql = `INSERT INTO clipboard (text) VALUES (?);`;
  console.log("SQL: ", sql);

  db.run(sql, content, (error) => {
    if (error === null) return;
    console.log("error: ", error);
  });
  console.log("insert done.");

});

// this var will keep track of window
let mainWindow = null;

let ctrlPressedLast = null;

ioHook.on('keydown', event => {
  console.log(Date.now(), event);

  // if ctrl pressed twice and window is not showing , create window
  if (event.keycode === keyCodeCtrl) {
    let ctrlPressedNow = Date.now();
    if (ctrlPressedNow - ctrlPressedLast < 300) {
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
  mainWindow.loadFile('index.html')

  // send list to the windows
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('list', listOfItemsToShow);
  });

  mainWindow.on('closed', (e) => {
    console.log('event closed emitted.');
    mainWindow = null;
  });

  mainWindow.on('blur', () => {
    console.log('event blur emitted.');
    mainWindow.close();
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindowIfNotExists()
})

ipcMain.on('close', (event, arg) => {
  mainWindow.close();
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
