const DIRECTORIES = 'directories';

class Settings {
	constructor() {
		const storage = window.localStorage.getItem(DIRECTORIES);
		this.value = storage !== null ?
			JSON.parse(storage) :
			[];
	}

	set directories(value) {
		this.value = value;
		window.localStorage.setItem(DIRECTORIES, JSON.stringify(value));
	}

	get directories() {
		return this.value;
	}
}

module.exports = Settings;