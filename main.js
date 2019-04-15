const {app, BrowserWindow} = require('electron')

let window;

function create_window () {
	window = new BrowserWindow({
		width: 800,
		height: 700,
		webPreferences: {
			nodeIntegration: true
		}
	});

	window.loadFile('src/index.html');
	window.on('closed', () => window = null);
}

app.on('ready', create_window);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (window === null) {
		create_window();
	}
});
