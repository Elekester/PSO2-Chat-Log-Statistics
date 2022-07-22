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
		this.filters = {
		}
	}
	
	get passed_filters() {
		return true;
	}
}

ChatStats.classes.Filter = class Filter {
	constructor() {
	}
}

/******************************************************************************
 * ChatStats.utilities
 *****************************************************************************/
ChatStats.utilities = {};

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
		if (!file.name.includes('ChatLog') || !file.type === 'text/plain' || file.size > 10000000) continue; // Skip any files that don't look like PSO2 chat logs.
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
		
		// Convert the chat log to messages objects. Creat known player list.
		let file_lines = (await file.text()).replace(/\r/g, '').split('\n');
		for (const line of file_lines) {
			const message_split = line.split('\t');
			if (!message_split?.[0] || !message_split?.[1] || !message_split?.[2] || !message_split?.[3] || !message_split?.[4] || !message_split?.[5]) continue; // Skip any messages that are missing data.
			let message = new ChatStats.classes.Message(message_split[0], (message_split[2] === 'CHANNEL') ? 'GROUP' : message_split[2], message_split[3], message_split[4], message_split[5], symbol_flag);
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
	ChatStats.data.messages.sort((message_1, message_2) => Date.parse(message_1.time) - Date.parse(message_2.time));
	console.log(ChatStats.data.messages.map((elem) => elem.time));
	ChatStats.flags.uploading = false;
}

ChatStats.main.update_output = function() {
	if (ChatStats.flags.uploading) {
		setTimeout(ChatStats.main.update_output, 50);
		return;
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
	let csv_content = '';
	let name = '';
	
	if (e.altKey) {
		if (ChatStats.data.messages.length === 0) return; // Don't download when there are no messasges.
		csv_content += '"Time","Chat","Player ID","Name","Symbol","Content"\r\n'
		ChatStats.data.messages.forEach(message => {
			csv_content += '"' + message.time + '","' + message.chat + '","' + message.player_id + '","' + message.name + '","' + message.is_symbol + '","' + message.content + '"\r\n';
		});
		name = 'ChatLog';
	} else {
		let output_table = document.getElementById('output');
		if (output_table.rows.length === 1) return; // Don't download an empty table.
		[...output_table.rows].forEach(row => {
			csv_content += '"' + [...row.cells].map(cell => cell.innerText).join('","') + '"\r\n';
		});
		name = 'ChatLogStatistics';
	}
	let encoded_content = encodeURIComponent(csv_content);
	let download = document.createElement('a');
	download.href = 'data:text/csv;charset=utf-9,' + encoded_content;
	download.download = name + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + ChatStats.data.download_count.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + '.csv';
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
	ChatStats.data.players = [];
	ChatStats.data.player_ids = [];
	ChatStats.data.messages = [];
	ChatStats.data.files = [];
	
	/******************************************************************************
	 * ChatStats.flags
	 *****************************************************************************/	
	ChatStats.flags.uploading = false;
	
	/******************************************************************************
	 * Event Listeners
	 *****************************************************************************/
	if (!ChatStats.flags.initialized) {
		window.removeEventListener('load', ChatStats.init);
		for (let cell of document.getElementById('output').rows[0].cells) {
			cell.addEventListener('click', ChatStats.utilities.sort_table);
		}
		document.getElementById('download_output').addEventListener('click', ChatStats.main.download_output);
		ChatStats.flags.initialized = true;
	}
}

window.addEventListener('load', ChatStats.init);