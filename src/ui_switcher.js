class UISwitcher {
	constructor() {
		this.settings_active = false;
		this.main = document.querySelector('main').classList;
	}

	switch() {
		this.settings_active = !this.settings_active;
		if (this.settings_active) {
			this.main.add('settings_active');
		} else {
			search_ui.navigate_to();
			this.main.remove('settings_active');
		}
	}
}

module.exports = UISwitcher;