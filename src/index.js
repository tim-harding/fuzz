'use strict';

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const found = [];
let matches_count = 0;
const list_items = [];
let selection = -1;

function main() {
	initialize_from_settings();
	initialize_search_results_ui();
	document.addEventListener('keydown', handle_keydown);
}

function initialize_from_settings() {
	const settings = window.localStorage.getItem('directories');
	if (settings !== null) {
		const directories = JSON.parse(settings);
		for (const directory of directories) {
			gather_from(directory);
		}
	}
}

function initialize_search_results_ui() {
	const results = document.getElementById('results');
	const template = document.getElementById('list_item_template');
	for (let i = 0; i < 9; i++) {
		const clone = document.importNode(template.content, true);
		const root = clone.querySelector('.list_item'); 
		root.onmouseover = () => set_selection(i);
		const name = clone.querySelector('.directory_name');
		const path = clone.querySelector('.directory_path');
		results.appendChild(clone);
		list_items.push({
			root: root, 
			name: name,
			path: path,
		});
	}
}

function gather_from(base) {
	fs.readdir(base, (err, contents) => {
		if (!err) {
			for (const item of contents) {
				const full_path = path.join(base, item);
				fs.lstat(full_path, (err, stats) => {
					if (!err && stats.isDirectory()) {
						found.push({
							name: item.toLowerCase(),
							path: full_path.toLowerCase(),
						});
					}
				});
			}
		}
	});
}

function update_found(sender) {
	const query = sender.value.toLowerCase();
	let matches = found.filter(value => value.name.includes(query));
	if (query == '') {
		matches = [];
	}
	matches_count = matches.length;
	for (let i = 0; i < list_items.length; i++) {
		const element = list_items[i];
		let name = '';
		let path = '';
		if (i < matches.length) {
			name = matches[i].name;
			path = matches[i].path;
		}
		element.name.innerHTML = name;
		element.path.innerHTML = path;
	}
	update_selection();
}

function update_selection() {
	selection = Math.min(Math.max(0, selection), matches_count - 1);
	for (let i = 0; i < list_items.length; i++) {	
		const element = list_items[i];
		if (i == selection) {
			element.root.classList.add('selected');
		} else {
			element.root.classList.remove('selected');
		}
	}
}

function handle_keydown(event) {
	if (event.ctrlKey) {
		switch (event.key) {
			case 'j':
				offset_selection(1);
				break;
			case 'k':
				offset_selection(-1);
				break;
		}
	} else {
		switch (event.key) {
			case 'Enter':
				open_selection();
				break;
			case 'ArrowUp':
				offset_selection(-1);
				break;
			case 'ArrowDown':
				offset_selection(1);
				break;
		}
	}
}

function offset_selection(offset) {
	set_selection(selection + offset);
}

function set_selection(index) {
	selection = index;
	update_selection();
}

function open_selection() {
	const current_selection = list_items[selection].path.innerHTML;
	child_process.exec(`start "" "${current_selection}"`);
}

main();