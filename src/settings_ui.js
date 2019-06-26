const { dialog } = require('electron').remote;

class SettingsUI {
	constructor(settings, switcher) {
		this.settings = settings;
		this.switcher = switcher;
		this.initialize_members();
		this.initialize_handlers();
		this.initialize_ui();
	}

	initialize_members() {
		this.item_template = document.getElementById('setting_template');
		this.settings_list = document.getElementById('settings_list');
	}

	initialize_handlers() {
		document.getElementById('save_button').onclick = this.commit_storage.bind(this);
		document.getElementById('cancel_button').onclick = this.go_back.bind(this);
		document.getElementById('add_button').onclick = this.insert_row.bind(this, '');
	}

	initialize_ui() {
		for (const directory of this.settings.directories) {
			this.insert_row(directory);
		}
	}

	commit_storage() {
		const directories = [];
		for (const child of this.settings_list.children) {
			directories.push(child.querySelector('input').value);
		}
		this.settings.directories = directories;
		this.go_back();
	}

	insert_row(value) {
		const clone = document.importNode(this.item_template.content, true);
		const directory_input = clone.querySelector('input[name=directory]');
		const list_item = clone.querySelector('li');
		const remove_button = clone.querySelector('.remove_button');
		const browse_button = clone.querySelector('.browse_button');
		directory_input.value = value;
		remove_button.onclick = () => this.remove_item(list_item);
		browse_button.onclick = () => this.browse(list_item);
		this.settings_list.appendChild(clone);
	}

	go_back() {
		this.switcher.switch();
	}

	remove_item(item) {
		item.parentNode.removeChild(item);
	}

	browse(item) {
		let options = { properties: ['openDirectory'] };
		dialog.showOpenDialog(options, filePaths => {
			if (filePaths !== undefined) {
				const directory = filePaths[0];
				const input = item.querySelector('input');
				input.value = directory;
			}
		});
	}
}

module.exports = SettingsUI;