'use strict';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

class Search {
	constructor() {
		this.initialize_members();
		this.initialize_handlers();
		this.gather_directories();
		this.initialize_search_results_ui();
	}	

	initialize_members() {
		this.found = [];
		this.matches_count = 0;
		this.list_items = [];
		this.selection = -1;
	}

	initialize_handlers() {
		document.getElementById('query').oninput = e => this.update_found(e);
		document.getElementById('results').onclick = e => this.open_selection(e);
		document.addEventListener('keydown', e => this.handle_keydown(e));
	}

	gather_directories() {
		const settings = window.localStorage.getItem('directories');
		if (settings !== null) {
			const directories = JSON.parse(settings);
			for (const directory of directories) {
				this.gather_from(directory);
			}
		}
	}

	initialize_search_results_ui() {
		const results = document.getElementById('results');
		const template = document.getElementById('search_result_template');
		for (let i = 0; i < 9; i++) {
			const clone = document.importNode(template.content, true);
			const root = clone.querySelector('.search_result'); 
			root.onmouseover = () => this.set_selection(i);
			const name = clone.querySelector('.directory_name');
			const path = clone.querySelector('.directory_path');
			results.appendChild(clone);
			this.list_items.push({
				root: root, 
				name: name,
				path: path,
			});
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

	update_found(event) {
		const query = event.target.value.toLowerCase();
		let matches = this.found.filter(value => value.name.includes(query));
		if (query == '') {
			matches = [];
		}
		this.matches_count = matches.length;
		for (let i = 0; i < this.list_items.length; i++) {
			const element = this.list_items[i];
			let name = '';
			let path = '';
			if (i < matches.length) {
				name = matches[i].name;
				path = matches[i].path;
			}
			element.name.innerHTML = name;
			element.path.innerHTML = path;
		}
		this.update_selection();
	}

	update_selection() {
		this.selection = Math.min(Math.max(0, this.selection), this.matches_count - 1);
		for (let i = 0; i < this.list_items.length; i++) {	
			const element = this.list_items[i];
			if (i == this.selection) {
				element.root.classList.add('selected');
			} else {
				element.root.classList.remove('selected');
			}
		}
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
			switch (event.key) {
				case 'Enter':
					this.open_selection();
					break;
				case 'ArrowUp':
					this.decrement_selection();
					break;
				case 'ArrowDown':
					this.increment_selection();
					break;
			}
		}
	}

	increment_selection() {
		this.selection++;
		this.update_selection();
	}

	decrement_selection() {
		this.selection--;
		this.update_selection();
	}

	set_selection(index) {
		this.selection = index;
		this.update_selection();
	}

	open_selection() {
		const current_selection = this.list_items[this.selection].path.innerHTML;
		child_process.exec(`start "" "${current_selection}"`);
	}
}


class Settings {
	constructor() {
		initialize_members();
		initialize_handlers();
		initialize_ui();
	}

	initialize_members() {
		this.item_template = document.getElementById('setting_template');
		this.dir_list = document.getElementById('dir_list');
	}

	initialize_handlers() {
		document.getElementById('save_button').onclick = () => this.commit_storage();
		document.getElementById('cancel_button').onclick = () => this.go_back();
		document.getElementById('add_button').onclick = () => this.insert_row("");
	}

	initialize_ui() {
		const settings = window.localStorage.getItem('directories');
		if (settings !== null) {
			const directories = JSON.parse(settings);
			for (const directory of directories) {
				insert_row(directory);
			}
		}
	}

	commit_storage() {
		const directories = [];
		for (const child of dir_list.children) {
			directories.push(child.querySelector('input').value);
		}
		window.localStorage.setItem('directories', JSON.stringify(directories));
		go_back();
	}

	insert_row(value) {
		const clone = document.importNode(this.item_template.content, true);
		const directory_input = clone.querySelector('input[name=directory]');
		const list_item = clone.querySelector('li');
		const remove_button = clone.querySelector('.remove_button');
		directory_input.value = value;
		remove_button.onclick = () => remove_item(list_item);
		dir_list.appendChild(clone);
	}

	go_back() {
		window.history.back();
	}

	remove_item(item) {
		item.parentNode.removeChild(item);
	}
}

new Search();
// new Settings();