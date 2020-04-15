require('electron').ipcRenderer.on('list', (event, message) => {
  console.log(message);
});