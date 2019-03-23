const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const found = [];
let matches_count = 0;
const list_elements = [];
let query_input;
let selection = 0;

function main() {
	fs.readFile('./fuzz.config', 'utf8', (err, data) => {
		if (!err) {
			for (let line of data.split('\n')) {
				gather_from(line.trim());
			}
		}
	});

	query_input = document.querySelector('input[name=query]');
	query_input.oninput = update_found;
	document.addEventListener('keydown', handle_keydown);

	const results = document.getElementById('results');
	const template = document.getElementsByTagName('template')[0];
	const list_element = template.content.querySelector('#list_element');
	for (let i = 0; i < 9; i++) {
		const instance = list_element.cloneNode(true);
		instance.classList.add(i % 2 == 0 ? 'even' : 'odd');
		results.appendChild(instance);
		const directory_name = instance.querySelector('.directory_name');
		const directory_path = instance.querySelector('.directory_path');
		list_elements.push({
			root: instance, 
			name: directory_name,
			path: directory_path,
		});
	}
	update_selection();
	highlight_selection();
}

function gather_from(base) {
	fs.readdir(base, (err, contents) => {
		console.log(err);
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

function update_found() {
	const query = query_input.value.toLowerCase();
	let matches = found.filter(value => value.name.includes(query));
	if (query == '') {
		matches = [];
	}
	matches_count = matches.length;
	for (let i = 0; i < list_elements.length; i++) {
		const element = list_elements[i];
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
	highlight_selection();
}

function update_selection() {
	selection = Math.min(Math.max(0, selection), matches_count - 1);
}

function highlight_selection() {
	for (let i = 0; i < list_elements.length; i++) {	
		const element = list_elements[i];
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
				selection++;
				break;
			case 'k':
				selection--;
				break;
			case 'Enter':
				if (selection != -1) {
					const current_selection = found[selection].path;
					child_process.exec(`start "" "${current_selection}"`);
				}
				break;
		}
		update_selection();
		update_found();
	}
}

main();