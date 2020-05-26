'use strict'

import { app, BrowserWindow, clipboard, ipcMain, Menu, MenuItem } from 'electron';
import ioHook from 'iohook';
import sqlite3 from 'sqlite3';
import path from 'path';
import process from 'process';

sqlite3.verbose();

const appDataDirPath = app.getPath('userData');

const db = new sqlite3.Database(path.join(appDataDirPath, 'sqlite.db'), error => {
    if (error !== null) {
        console.log(error);
    }
});

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS clipboard (id TIMESTAMP PRIMARY KEY DEFAULT CURRENT_TIMESTAMP, text TEXT NOT NULL);');
    db.run('CREATE TABLE IF NOT EXISTS template (id INTEGER PRIMARY KEY, text TEXT NOT NULL);');
    // initial value. do this or I need to change SQL in add_to_db... function. This way is easier, so I am doing this.
    db.run("INSERT INTO clipboard(text) values ('');");
});

const keyCodeCtrl = 29;

// when clipboard is changed, add clipboard content to DB
// But if the content is the same as the newest content in DB, do not add.
// Maybe not best practice to poll on clipboard, but this is the only way I can think of right now.
// If in the future I find some library/tool, replace this code below with it.
function add_to_db_when_clipboard_changed() {
    // console.log('Clipboard changed');
    let content = clipboard.readText();
    // console.log("content: ", content);
    let sql =
        `INSERT INTO clipboard(text) 
     SELECT text
     FROM (SELECT ? AS text) AS temp
     WHERE temp.text <> (SELECT text FROM clipboard ORDER BY id DESC LIMIT 1);`;
    //console.log("SQL: ", sql);

    db.run(sql, content, (error) => {
        if (error === null) return;
        console.log("error: ", error);
    });
    // console.log("insert done.");
}
setInterval(add_to_db_when_clipboard_changed, 1000);


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
        if (sinceCtrlPressedLast < 300 &&
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

    // create a new windows
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
        frame: false,
        alwaysOnTop: true,
    })

    // add seacrch. activated by ctrl+shift+f
    if (process.platform === "darwin") {

        // make menu tempalte
        const template = [{
            label: 'Electron',
            submenu: [{
                    label: 'Search',
                    accelerator: 'Ctrl+Shift+F',
                    click: () => {
                        console.log("searching!");

                        // show modale search window
                        const newTemplateWin = new BrowserWindow({
                            parent: mainWindow,
                            modal: true,
                            show: false,
                            webPreferences: {
                                nodeIntegration: true,
                            },
                        });
                        newTemplateWin.loadFile(path.join(__dirname, 'search_window.html'));
                        newTemplateWin.once('ready-to-show', () => {
                            newTemplateWin.show()
                        })
                    }
                },
                {
                    label: "Toggle DevTools",
                    accelerator: "Alt+CmdOrCtrl+I",
                    click: () => {
                        BrowserWindow.getFocusedWindow().toggleDevTools();
                    }
                }
            ]
        }];
        console.log("menu added!", process.platform);
        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    } else {
        // on non-mac platform(windows and linux)
        const menu = new Menu();
        menu.append(new MenuItem({
            label: "Search",
            accelerator: "Ctrl+Shift+F",
            click: () => {
                console.log("searching!");

                // show modale search window
                const newTemplateWin = new BrowserWindow({
                    parent: mainWindow,
                    modal: true,
                    show: false,
                    webPreferences: {
                        nodeIntegration: true,
                    },
                });
                newTemplateWin.loadFile(path.join(__dirname, 'search_window.html'));
                newTemplateWin.once('ready-to-show', () => {
                    newTemplateWin.show()
                })
            }
        }));
        mainWindow.setMenu(menu);
    }

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    console.log("__dirnmae: ", __dirname);

    // send list to the windows
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('clipboard');
        //mainWindow.webContents.openDevTools();
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

        if (mainWindow.getChildWindows().length > 0) {
            return;
        }
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
app.on('window-all-closed', () => {})

app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        createWindowIfNotExists();
    }
})

ipcMain.on('close', (event, arg) => {
    mainWindow.close();
});

ipcMain.on("search", (event, arg) => {
    console.log("arg", arg);

    mainWindow.webContents.send("search", arg);
})