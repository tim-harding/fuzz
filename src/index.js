'use strict';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const MATCHES_COUNT = 9;
const DIRECTORIES = 'directories';
const SELECTED = 'selected';

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
		for (let i = 0; i < count && found < MATCHES_COUNT; i++) {
			const path = this.found[i].path;
			if (path.includes(query)) {
				this.filtered_indices[found] = i;
				found++;
			}
		}
		this.count = found;
		for (; found < MATCHES_COUNT; found++) {
			this.filtered_indices[found] = -1;
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
		document.addEventListener('keydown', this.handle_keydown.bind(this));
	}

	initialize_search_results_ui() {
		const results = document.getElementById('results');
		const template = document.getElementById('search_result_template');
		for (let i = 0; i < MATCHES_COUNT; i++) {
			const clone = document.importNode(template.content, true);
			const root = clone.querySelector('.search_result'); 
			root.onmouseover = this.update_selection.bind(this, i);
			const name = clone.querySelector('.directory_name');
			const path = clone.querySelector('.directory_path');
			results.appendChild(clone);
			this.result_elements.push({
				root: root, 
				name: name,
				path: path,
			});
		}
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
			element.name.innerHTML = match.name;
			element.path.innerHTML = match.path;
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
		this.modify_selection(false);
		this.selection = Math.min(Math.max(0, index), this.matches.count - 1);
		this.modify_selection(true);
	}

	modify_selection(add) {
		if (this.selection > -1) {
			const classes = this.result_elements[this.selection].root.classList;
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
}


class SettingsUI {
	constructor() {
		this.initialize_members();
		this.initialize_handlers();
		this.initialize_ui();
	}

	initialize_members() {
		this.item_template = document.getElementById('setting_template');
		this.dir_list = document.getElementById('dir_list');
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
		for (const child of this.dir_list.children) {
			directories.push(child.querySelector('input').value);
		}
		window.localStorage.setItem('directories', JSON.stringify(directories));
		this.go_back();
	}

	insert_row(value) {
		const clone = document.importNode(this.item_template.content, true);
		const directory_input = clone.querySelector('input[name=directory]');
		const list_item = clone.querySelector('li');
		const remove_button = clone.querySelector('.remove_button');
		directory_input.value = value;
		remove_button.onclick = () => this.remove_item(list_item);
		this.dir_list.appendChild(clone);
	}

	go_back() {
		window.history.back();
	}

	remove_item(item) {
		item.parentNode.removeChild(item);
	}
}

const settings = new Settings();
new SearchUI();
// new SettingsUI();