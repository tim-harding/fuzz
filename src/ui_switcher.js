class UISwitcher {
	constructor() {
		this.settings_active = false;
		this.main = document.querySelector('main').classList;
		this.callbacks = [];
	}

	switch() {
		this.settings_active = !this.settings_active;
		if (this.settings_active) {
			this.main.add('settings_active');
		} else {
			this.main.remove('settings_active');
		}

		for (const callback of this.callbacks) {
			callback(this.settings_active);
		}
	}

	register_callback(callback) {
		this.callbacks.push(callback);
	}
}

module.exports = UISwitcher;