const Matches = require('./matches');
const child_process = require('child_process');

const MATCHES_COUNT = 9;

class SearchUI {
	constructor(settings, switcher) {
		this.settings = settings;
		this.switcher = switcher;
		this.initialize_members();
		this.initialize_handlers();
		this.initialize_search_results_ui();
	}	

	initialize_members() {
		this.selection = -1;
		this.result_elements = [];
		this.matches = new Matches(this.settings);
		this.query = document.getElementById('query');
	}

	initialize_handlers() {
		document.getElementById('query').oninput = this.update_found.bind(this);
		document.getElementById('results').onclick = this.open_selection.bind(this);
		document.getElementById('settings_gear').onclick = this.open_settings.bind(this);
		document.addEventListener('keydown', this.handle_keydown.bind(this));
		this.switcher.register_callback(this.handle_switch.bind(this));
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

	update_found() {
		const query = this.query.value.toLowerCase();
		this.matches.filter(query);
		const found = this.matches.found;
		const indices = this.matches.filtered_indices;
		for (let i = 0; i < 9; i++) {
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
				classes.add('selected');
			} else {
				classes.remove('selected');
			}
		}
	}

	open_selection() {
		const current_selection = this.result_elements[this.selection].path.innerHTML;
		child_process.exec(`start "" "${current_selection}"`);
	}

	open_settings() {
		this.switcher.switch();
	}

	handle_switch(settings_active) {
		if (!settings_active) {
			this.matches.gather();
			this.query.value = '';
			this.update_found();
			this.query.focus();
		}
	}
}

module.exports = SearchUI;