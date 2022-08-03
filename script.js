/******************************************************************************
 * Welcome to script.js, where all the magic happens.
 *
 * If you're adding a new filter, add it to the Message class's filter
 *   property, its get filtered method and make sure that
 *   ChatStats.chat_logs_change runs it at the end if filter_flag is true.
 *****************************************************************************/

let ChatStats = {};

/******************************************************************************
 * ChatStats.classes
 *****************************************************************************/
ChatStats.classes = {};

ChatStats.classes.Player = class Player {
	constructor(id) {
		this.id = id;
		this.messages = [];
		this.names = [];
	}
}

ChatStats.classes.Message = class Message {
	constructor(time, chat, player_id, name, content, is_symbol) {
		this.time = time;
		this.chat = chat;
		this.player_id = player_id;
		this.name = name;
		this.content = content;
		this.is_symbol = is_symbol;
		this.filters = {};
	}
	
	get passed_filters() {
		for (const filter of ChatStats.data.filters.active) {
			if (!this.filters[filter.id]) {
				return false;
			}
		}
		return true;
	}
	
	static compare(message_1, message_2) {
		return (message_1.time === message_2.time) && (message_1.player_id === message_2.player_id) && (message_1.content === message_2.content);
	}
}

ChatStats.classes.Filter = class Filter {
	constructor(type, desc, color, settings, apply) {
		this.id = ChatStats.utilities.rand_int(10**9, 10**10);
		this.type = type;
		this.desc = desc;
		this.color = color;
		this.settings = {};
		for (const [option_name, option_settings] of Object.entries(settings)) {
			this.settings[option_name] = {};
			for (const [key, value] of Object.entries(option_settings)) {
				this.settings[option_name][key] = value;
			}
		}
		this.apply = apply.bind(this);
		let filter_div = document.createElement('div');
		filter_div.innerText = type;
		filter_div.classList.add('filter');
		filter_div.id = 'filter' + this.id;
		filter_div.style.backgroundColor = color;
		filter_div.title = desc;
		document.getElementById('filter_bar').appendChild(filter_div);
	}
	
	remove_element() {
		document.getElementById('filter' + this.id).remove();
		return this;
	}
}

ChatStats.classes.Filters = class Filters {
	constructor() {
		this.active = [];
	}
	
	add(type = 'none', desc = 'This filter does nothing.', color = '#e2e2e2', settings = {}, apply_callback = function(){return true;}) {
		let f = new ChatStats.classes.Filter(type, desc, color, settings, apply_callback);
		this.active.push(f);
		return f;
	}
	
	remove(filter) {
		if (typeof(filter) === 'number') {
			if (filter < 10**9) {
				filter = this.active[filter];
			} else {
				filter = this.active.find(item => item.id === filter);
			}
		}
		let result = filter?.remove_element();
		if (result) {
			let index = this.active.indexOf(result);
			this.active.splice(index, 1);
		}
		return result;
	}
	
	static types = [
		{
			name: 'Name/ID',
			func: 'add_nameId',
			desc: 'Filter messages by the Character/Player Name or Player ID of the player who sent the message.',
			color: '#aaaae9',
			settings: {
				name_list: {value: ''},
				name_sensitivity: {value: 80},
				player_id_list: {value: ''},
				or_flag: {value: true}
			}
		}, {
			name: 'Content',
			func: 'add_content',
			desc: 'Filter messages by their content.',
			color: '#aae9aa',
			settings: {
				string: {value: ''},
				is_regex: {value: false},
				regex_flags: {value: ''}
			}
		}, {
			name: 'Date',
			func: 'add_date',
			desc: 'Filter messages by their date.',
			color: '#e9aaaa',
			settings: {
				start_date: {value: '2012-07-04'},
				end_date: {value: new Date().toLocaleString('sv').slice(0, 10)}
			}
		}
	];
	
	add_nameId(settings = this.constructor.types[0].settings) {
		this.add(this.constructor.types[0].name, this.constructor.types[0].desc, this.constructor.types[0].color, settings, function() {
			let no_name_list = this.settings.name_list.value === '';
			let names;
			if (no_name_list) {
				names = [];
			} else {
				names = this.settings.name_list.value.split(/[\t\n\r,]+/).map(name => name.trim());
			}
			let cutoff = this.settings.name_sensitivity.value / 100;
			let no_id_list = this.settings.player_id_list.value === '';
			let ids;
			if (no_id_list) {
				ids = [];
			} else {
				ids = this.settings.player_id_list.value.split(/[\t\n\r,]+/).map(id => id.trim());
			}
			for (const player of ChatStats.data.players) {
				let name_flag = no_name_list;
				for (const name of names) {
					for (const player_name of player.names) {
						if (ChatStats.utilities.similarity(name, player_name) >= cutoff) {
							name_flag = true;
							break;
						}
					}
					if (name_flag) break;
				}
				let id_flag = no_id_list;
				if (ids.includes(player.id)) id_flag = true;
				for (let message of player.messages) {
					let flag;
					if (no_name_list) {flag = id_flag}
					else if (no_id_list) {flag = name_flag}
					else if (this.settings.or_flag.value) {flag = id_flag || name_flag}
					else {flag = id_flag && name_flag}
					message.filters[this.id] = flag;
				}
			}
		});
	}
	
	add_content(settings = this.constructor.types[1].settings) {
		this.add(this.constructor.types[1].name, this.constructor.types[1].desc, this.constructor.types[1].color, settings, function() {
			let string = this.settings.string.value;
			if (!string) {
				for (let message of ChatStats.data.messages) {
					message.filters[this.id] = true;
				}
				return;
			}
			let re;
			if (this.settings.is_regex.value) {
				re = new RegExp(string, this.settings.regex_flags.value);
			} else {
				re = new RegExp(string, 'i');
			}
			for (let message of ChatStats.data.messages) {
				message.filters[this.id] = re.test(message.content);
			}
		});
	}
	
	add_date(settings = this.constructor.types[2].settings) {
		this.add(this.constructor.types[2].name, this.constructor.types[2].desc, this.constructor.types[2].color, settings, function() {
			let start_date = Date.parse(this.settings.start_date.value);
			let end_date = Date.parse(this.settings.end_date.value) + 86400000; // Add a day in ms to adjust for inclusivity.
			for (let message of ChatStats.data.messages) {
				let message_date = Date.parse(message.time);
				message.filters[this.id] = message_date >= start_date && message_date <= end_date;
			}
		});
	}
}

/******************************************************************************
 * ChatStats.utilities
 *****************************************************************************/
ChatStats.utilities = {};

ChatStats.utilities.rand_int = function (min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

/* Credit to overlord1234. https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely */
ChatStats.utilities.levenshtein_distance = function (string_1, string_2, ignore_case = true) {
	if (ignore_case) {
		string_1 = string_1.toLowerCase();
		string_2 = string_2.toLowerCase();
	}

	let costs = new Array();
	for (let i = 0; i <= string_1.length; i++) {
		let last_value = i;
		for (let j = 0; j <= string_2.length; j++) {
			if (i == 0) {
				costs[j] = j;
			} else {
				if (j > 0) {
					let new_value = costs[j - 1];
					if (string_1.charAt(i - 1) !== string_2.charAt(j - 1)) {
						new_value = Math.min(Math.min(new_value, last_value), costs[j]) + 1;
					}
					costs[j - 1] = last_value;
					last_value = new_value;
				}
			}
		}
		if (i > 0) {
			costs[string_2.length] = last_value;
		}
	}
	return costs[string_2.length];
}

/* Credit to overlord1234. https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely */
ChatStats.utilities.similarity = function (string_1, string_2) {
	let longer = string_1;
	let shorter = string_2;
	if (string_1.length < string_2.length) {
		longer = string_2;
		shorter = string_1;
	}
	let length = longer.length;
	if (length == 0) {
		return 1.0;
	}
	return (length - ChatStats.utilities.levenshtein_distance(longer, shorter)) / parseFloat(length);
}

ChatStats.utilities.drop_handler = function(event, callback) {
	event.preventDefault();
	callback(event.dataTransfer.files);
}

ChatStats.utilities.drop_over_handler = function(event) {
	event.preventDefault();
}

ChatStats.utilities.sort_table = async function() {
	let output_table = document.getElementById('output');
	if (output_table.rows.length === 1) return; // Don't sort an empty table.
	let output_rows = [...output_table.rows];
	let output_header = output_rows.shift();
	
	let sort_ascending = ChatStats.utilities.sort_ascending;
	let sort_index = [...output_header.children].indexOf(this);
	if (sort_index === ChatStats.utilities.sort_index) {sort_ascending = -1 * sort_ascending;}
	else if (sort_index < 6) {sort_ascending = 1;}
	else {sort_ascending = -1;}
	ChatStats.utilities.sort_ascending = sort_ascending;
	ChatStats.utilities.sort_index = sort_index;
	
	if (sort_index < 7) {output_rows.sort((a, b) => sort_ascending * (b.cells[sort_index].innerText - a.cells[sort_index].innerText));}
	else {output_rows.sort((a, b) => sort_ascending * (new Intl.Collator('en').compare(b.cells[sort_index].innerText, a.cells[sort_index].innerText)));}
	
	for (const row of output_rows) row.remove();
	for (const row of output_rows) output.children[0].appendChild(row);
}

/******************************************************************************
 * ChatStats.data
 *****************************************************************************/
ChatStats.data = {};
ChatStats.data.download_count = 0;

/******************************************************************************
 * ChatStats.flags
 *****************************************************************************/
ChatStats.flags = {};
ChatStats.flags.initialized = false;

/******************************************************************************
 * ChatStats.main
 *****************************************************************************/
ChatStats.main = {};

ChatStats.main.chat_log_files_change = async function(files) {
	ChatStats.flags.uploading = true;
	files ??= document.getElementById('chat_log_files').files;
	
	for (const file of files) {
		document.getElementById('chat_log_total_file_count').innerText++; // Increment file count.
		if (!(file.name.includes('ChatLog') || file.name.includes('ChatStatsLog')) || !file.type === 'text/plain') continue; // Skip any files that don't look like PSO2 chat logs.
		let duplicate_flag = false;
		for (const old_file of ChatStats.data.files) {
			if (old_file.lastModified === file.lastModified && old_file.name === file.name && old_file.size === file.size && old_file.type === file.type) {
				duplicate_flag = true;
			}
			if (duplicate_flag) break;
		}
		if (duplicate_flag) continue; // Skip any files that are probably duplicates.
		ChatStats.data.files.push(file);
		document.getElementById('chat_log_file_count').innerText++; // Increment chat log count.
		let symbol_flag = file.name.includes('Symbol');
		let chat_stats_flag = file.name.includes('ChatStatsLog');
		
		// Convert the chat log to messages objects. Creat known player list.
		let file_lines = (await file.text()).replace(/\r/g, '').split('\n');
		for (const line of file_lines) {
			const message_split = line.split('\t');
			if (!message_split?.[0] || !message_split?.[1] || !message_split?.[2] || !message_split?.[3] || !message_split?.[4] || !message_split?.[5]) continue; // Skip any messages that are missing data.
			let message = new ChatStats.classes.Message(new Date(message_split[0]).toISOString(), (message_split[2] === 'CHANNEL') ? 'GROUP' : message_split[2], message_split[3], message_split[4], message_split[5], (chat_stats_flag && message_split.hasOwnProperty(6)) ? message_split[6] : symbol_flag);
			ChatStats.data.messages.push(message);
			
			let player;
			if (!ChatStats.data.player_ids.includes(message.player_id)) {
				ChatStats.data.player_ids.push(message.player_id);
				player = new ChatStats.classes.Player(message.player_id);
				ChatStats.data.players.push(player);
			}
			player ??= ChatStats.data.players.find(player => player.id === message.player_id);
			player.messages.push(message);
			if (!player.names.includes(message.name)) player.names.push(message.name);
		}
	}
	
	for (const player of ChatStats.data.players) player.names.sort();
	
	// Remove duplicate messages.
	ChatStats.data.messages.sort((message_1, message_2) => Date.parse(message_1.time) - Date.parse(message_2.time));
	let length = ChatStats.data.messages.length;
	for (let i = length - 1; i > 0; i--) {
		if (ChatStats.classes.Message.compare(ChatStats.data.messages[i], ChatStats.data.messages[i-1])) {
			ChatStats.data.messages.splice(i, 1);
		}
	}
	
	ChatStats.flags.uploading = false;
}

ChatStats.main.add_filter = function() {
	document.getElementById('filter_dropdown').classList.toggle('show');
}

ChatStats.main.update_output = function() {
	if (ChatStats.flags.uploading) {
		setTimeout(ChatStats.main.update_output, 50);
		return;
	}
	
	for (const filter of ChatStats.data.filters.active) {
		filter.apply();
	}
	
	let output_table = document.getElementById('output');
	let output_rows = [...output_table.rows];
	output_rows.shift();
	for (const row of output_rows) row.remove();
	for (const player of ChatStats.data.players) {
		let message_count = {
			TOTAL: 0,
			PUBLIC: 0,
			PARTY: 0,
			GUILD: 0,
			REPLY: 0,
			GROUP: 0,
		}
		for (const message of player.messages) {
			if (!message.passed_filters) continue; // Don't count filtered messages.
			message_count.TOTAL++;
			message_count[message.chat]++;
		}
		if (message_count.TOTAL === 0) continue; // If a player's total filtered message count is 0, don't add them to the output.
		let row = document.createElement('tr');
		for (const chat of ['TOTAL', 'PUBLIC', 'PARTY', 'GUILD', 'REPLY', 'GROUP']) {
			let cell = document.createElement('td');
			cell.innerText = message_count[chat];
			row.appendChild(cell);
		}
		let player_id_cell = document.createElement('td');
		player_id_cell.innerText = player.id;
		row.appendChild(player_id_cell);
		let player_names_cell = document.createElement('td');
		player_names_cell.innerText = player.names.join(', ');
		row.appendChild(player_names_cell);
		output.children[0].appendChild(row);
	}
	
	ChatStats.utilities.sort_ascending = 1;
	ChatStats.utilities.sort_index = 7;
}

ChatStats.main.download_output = function(e) {
	if (ChatStats.flags.uploading) {
		setTimeout(() => ChatStats.main.download_output(e), 50);
		return;
	}
	
	let csv_content = '';
	let name = 'ChatStats';
	let file_type;
	if (e.ctrlKey) { // If ctrl is held down as the button is clicked, download the list of all messages.
		if (ChatStats.data.messages.length === 0) return; // Don't download when there are no messasges.
		ChatStats.data.messages.forEach(message => {
			csv_content += [message.time, '1', message.chat, message.player_id, message.name, message.content, message.is_symbol].join('\t') + '\r\n';
		});
		name += 'Log';
		file_type = '.txt';
	} else { // If ctrl is not held down as the button is clicked, download the output table.
		let output_table = document.getElementById('output');
		if (output_table.rows.length === 1) return; // Don't download an empty table.
		[...output_table.rows].forEach(row => {
			csv_content += '"' + [...row.cells].map(cell => cell.innerText).join('","') + '"\r\n';
		});
		file_type = '.csv';
	}
	let encoded_content = encodeURIComponent(csv_content);
	let download = document.createElement('a');
	download.href = 'data:text/csv;charset=utf-9,' + encoded_content;
	download.download = name + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + ChatStats.data.download_count.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + file_type;
	download.click();
	ChatStats.data.download_count++;
}

ChatStats.main.reset_all = function() {
	if (ChatStats.flags.uploading) {
		setTimeout(ChatStats.main.reset_all, 50);
		return;
	}
	
	[...document.getElementsByTagName('input')].forEach(element => {element.disabled = true;}); // Disable Input.
	
	document.getElementById('chat_log_files').value = '';
	document.getElementById('chat_log_file_count').innerText = 0;
	document.getElementById('chat_log_total_file_count').innerText = 0;
	
	let output_table = document.getElementById('output');
	let output_rows = [...output_table.rows];
	output_rows.shift();
	for (const row of output_rows) row.remove();
	
	for (let filter of ChatStats.data.filters.active || []) {
		filter.remove_element();
	}
	
	ChatStats.init();
	
	[...document.getElementsByTagName('input')].forEach(element => {element.disabled = false;}); // Enable Input.
}

/******************************************************************************
 * ChatStats.init
 *****************************************************************************/
ChatStats.init = function() {	
	/******************************************************************************
	 * ChatStats.utilities
	 *****************************************************************************/
	ChatStats.utilities.sort_ascending = 1;
	ChatStats.utilities.sort_index = 7;
	
	/******************************************************************************
	 * ChatStats.data
	 *****************************************************************************/
	ChatStats.data.filters = [];
	ChatStats.data.players = [];
	ChatStats.data.player_ids = [];
	ChatStats.data.messages = [];
	ChatStats.data.files = [];
	ChatStats.data.filters = new ChatStats.classes.Filters();
	
	/******************************************************************************
	 * ChatStats.flags
	 *****************************************************************************/	
	ChatStats.flags.uploading = false;
	
	/******************************************************************************
	 * Event Listeners
	 *****************************************************************************/
	if (!ChatStats.flags.initialized) {
		window.removeEventListener('load', ChatStats.init);
		
		for (const filter_type of ChatStats.classes.Filters.types) {
			let item = document.createElement('input');
			item.type = 'button';
			item.value = filter_type.name;
			item.title = filter_type.desc;
			item.onclick = () => ChatStats.data.filters[filter_type.func]();
			document.getElementById('filter_dropdown').appendChild(item);
		}
		window.addEventListener('click', (e) => {
			if (!event.target.matches('.dropdown_button')) {
				let dropdowns = document.getElementsByClassName('dropdown_content');
				for (let dropdown of dropdowns) {
					if (dropdown.classList.contains('show')) dropdown.classList.remove('show');
				}
			}
		});
		
		for (let cell of document.getElementById('output').rows[0].cells) {
			cell.addEventListener('click', ChatStats.utilities.sort_table);
		}
		
		window.addEventListener('keydown', (e) => {
			if (e.ctrlKey) document.getElementById('download_output').classList.add('ctrl_button');
		});
		window.addEventListener('keyup', (e) => {
			if (!e.ctrlKey) document.getElementById('download_output').classList.remove('ctrl_button');
		});
		
		ChatStats.flags.initialized = true;
		console.log("Howdy! - Nel");
	}
}

window.addEventListener('load', ChatStats.init);