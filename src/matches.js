const fs = require('fs');
const path = require('path');

const MATCHES_COUNT = 9;

class Matches {
	constructor(settings) {
		this.settings = settings;
		this.initialize_members();
		this.gather();
	}

	initialize_members() {
		this.found = [];
		this.filtered_indices = new Array(MATCHES_COUNT);
		this.count = 0;
	}

	gather() {
		this.found = [];
		for (const directory of this.settings.directories) {
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

module.exports = Matches;