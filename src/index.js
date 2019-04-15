'use strict';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const MATCHES_COUNT = 9;
const DIRECTORIES = 'directories';
const SELECTED = 'selected';
const SETTINGS_ACTIVE = 'settings_active';


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


class Matches {
	constructor() {
		this.initialize_members();
		this.gather();
	}

	initialize_members() {
		this.found = [];
		this.filtered_indices = new Array(MATCHES_COUNT);
		this.count = 0;
	}

	gather() {
		for (const directory of settings.directories) {
			this.gather_from(directory);
		}
	}

	gather_from(base) {
		fs.readdir(base, (err, contents) => {
			if (!err) {
				for (const item of contents) {
					const full_path = path.join(base, item);
					fs.lstat(full_path, (err, stats) => {
						if (!err && stats.isDirectory()) {
							this.found.push({
								name: item.toLowerCase(),
								path: full_path.toLowerCase(),
							});
						}
					});
				}
			}
		});
	}

	filter(query) {
		let found = 0;
		const count = this.found.length;
		if (query !== '') {
			for (let i = 0; i < count && found < MATCHES_COUNT; i++) {
				const name = this.found[i].name;
				if (name.includes(query)) {
					this.filtered_indices[found] = i;
					found++;
				}
			}
		}
		this.count = found;
		for (; found < MATCHES_COUNT; found++) {
			this.filtered_indices[found] = -1;
		}
	}
}


class UISwitcher {
	constructor() {
		this.settings_active = false;
		this.main = document.querySelector('main').classList;
	}

	switch() {
		this.settings_active = !this.settings_active;
		if (this.settings_active) {
			this.main.add(SETTINGS_ACTIVE);
		} else {
			this.main.remove(SETTINGS_ACTIVE);
		}
	}
}


class SearchUI {
	constructor() {
		this.initialize_members();
		this.initialize_handlers();
		this.initialize_search_results_ui();
	}	

	initialize_members() {
		this.selection = -1;
		this.result_elements = [];
		this.matches = new Matches();
	}

	initialize_handlers() {
		document.getElementById('query').oninput = this.update_found.bind(this);
		document.getElementById('results').onclick = this.open_selection.bind(this);
		document.getElementById('settings_button').onclick = this.open_settings.bind(this);
		document.addEventListener('keydown', this.handle_keydown.bind(this));
	}

	initialize_search_results_ui() {
		const template = document.getElementById('search_result_template');
		const fragment = document.createDocumentFragment();
		for (let i = 0; i < MATCHES_COUNT; i++) {
			const clone = template.content.cloneNode(true);
			const root = clone.querySelector('.search_result'); 
			root.onmouseover = this.update_selection.bind(this, i);
			const name = clone.querySelector('.directory_name');
			const path = clone.querySelector('.directory_path');
			fragment.appendChild(clone);
			this.result_elements.push({
				root: root, 
				name: name,
				path: path,
			});
		}
		const results = document.getElementById('results');
		results.appendChild(fragment);
	}

	update_found(event) {
		const query = event.target.value.toLowerCase();
		this.matches.filter(query);
		const found = this.matches.found;
		const indices = this.matches.filtered_indices;
		for (let i = 0; i < MATCHES_COUNT; i++) {
			const index = indices[i];
			const match = index > -1 ? found[index] : { name: '', path: '' };
			const element = this.result_elements[i];
			element.name.textContent = match.name;
			element.path.textContent = match.path;
		}
		this.update_selection(this.selection);
	}

	handle_keydown(event) {
		if (event.ctrlKey) {
			switch (event.key) {
			case 'j':
				this.increment_selection();
				break;
			case 'k':
				this.decrement_selection();
				break;
			}
		} else {
			switch (event.keyCode) {
			case 13: // Enter
				this.open_selection();
				break;
			case 38: // ArrowUp
				this.decrement_selection();
				break;
			case 40: // ArrowDown
				this.increment_selection();
				break;
			}
		}
	}

	increment_selection() {
		this.update_selection(this.selection + 1);
	}

	decrement_selection() {
		this.update_selection(this.selection - 1);
	}

	update_selection(index) {
		const previous = this.selection;
		const selection = Math.min(Math.max(0, index), this.matches.count - 1);
		if (selection !== previous) {
			this.modify_selection(previous, false);
			this.modify_selection(selection, true);
			this.selection = selection;
		}
	}

	modify_selection(index, add) {
		if (index > -1) {
			const classes = this.result_elements[index].root.classList;
			if (add) {
				classes.add(SELECTED);
			} else {
				classes.remove(SELECTED);
			}
		}
	}

	open_selection() {
		const current_selection = this.result_elements[this.selection].path.innerHTML;
		child_process.exec(`start "" "${current_selection}"`);
	}

	open_settings() {
		switcher.switch();
	}
}


class SettingsUI {
	constructor() {
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
		const settings = window.localStorage.getItem('directories');
		if (settings !== null) {
			const directories = JSON.parse(settings);
			for (const directory of directories) {
				this.insert_row(directory);
			}
		}
	}

	commit_storage() {
		const directories = [];
		for (const child of this.settings_list.children) {
			directories.push(child.querySelector('input').value);
		}
		settings.directories = directories;
		this.go_back();
	}

	insert_row(value) {
		const clone = document.importNode(this.item_template.content, true);
		const directory_input = clone.querySelector('input[name=directory]');
		const list_item = clone.querySelector('li');
		const remove_button = clone.querySelector('.remove_button');
		directory_input.value = value;
		remove_button.onclick = () => this.remove_item(list_item);
		this.settings_list.appendChild(clone);
	}

	go_back() {
		switcher.switch();
	}

	remove_item(item) {
		item.parentNode.removeChild(item);
	}
}


const settings = new Settings();
const switcher = new UISwitcher();
new SearchUI();
new SettingsUI();