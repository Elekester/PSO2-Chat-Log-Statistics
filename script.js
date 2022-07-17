/******************************************************************************
 * Welcome to script.js, where all the magic happens.
 *
 * If you're adding a new filter, add it to the Message class and make sure
 *   that ChatStats.chat_logs_change runs it at the end if filter_flag is true.
 *****************************************************************************/

let ChatStats = {};

/******************************************************************************
 * Classes
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
	constructor(time, chat, player_id, name, content) {
		this.time = time;
		this.chat = chat;
		this.player_id = player_id;
		this.name = name;
		this.content = content;
		this.filter = {
			name: true,
			content: true,
			date: true
		}
	}
	
	get filtered() {
		return Object.values(this.filter).reduce((prev, curr) => prev && curr, true);
	}
}

/******************************************************************************
 * Helpers
 *****************************************************************************/

ChatStats.helpers = {};

/* Credit to overlord1234. https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely */
ChatStats.helpers.levenshtein_distance = function (string_1, string_2, ignore_case = true) {
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
ChatStats.helpers.similarity = function (string_1, string_2) {
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
	return (length - ChatStats.helpers.levenshtein_distance(longer, shorter)) / parseFloat(length);
}

ChatStats.helpers.disable_input = function (promise) {
	let inputs = document.getElementsByTagName('input');
	for (let input of inputs) {
		input.disabled = true;
	}
	document.getElementById('calculate_button').disabled = true;
	ChatStats.helpers.input_is_disabled = true;
}

ChatStats.helpers.enable_input = function (promise) {
	let inputs = document.getElementsByTagName('input');
	for (let input of inputs) {
		input.disabled = false;
	}
	document.getElementById('calculate_button').disabled = false;
	ChatStats.helpers.input_is_disabled = false;
}

ChatStats.helpers.input_is_disabled = true;
ChatStats.helpers.filters_flag = true;

/******************************************************************************
 * Main
 *****************************************************************************/

ChatStats.known_players = [];
ChatStats.known_player_ids = [];
ChatStats.messages = [];

ChatStats.chat_logs_change = async function () {
	ChatStats.helpers.disable_input();
	
	// Reset everything.
	ChatStats.known_players = [];
	ChatStats.known_player_ids = [];
	ChatStats.messages = [];
	
	const chat_log_files = document.getElementById('chat_log_files').files;
	
	// If there are no files, enable only the chat logs files to upload and return.
	if (chat_log_files.length === 0) {
		ChatStats.helpers.filters_flag = true;
		ChatStats.helpers.input_is_disabled = true;
		document.getElementById('chat_log_files').disabled = false;
		return;
	}
	
	for (const file of chat_log_files) {
		// Skip any file that doesn't look like a chat log.
		if (!file.name.includes('ChatLog') || !file.type === 'text/plain' || file.size > 10000000) {
			continue;
		}
		
		let message_array = await file.text()
		message_array = message_array.replace(/\r/g,'').split('\n')
		for (const message_original of message_array) {
			const message_split = message_original.split('\t');
			
			// Skip any messages that are missing data.
			if (!message_split?.[0] || !message_split?.[1] || !message_split?.[2] || !message_split?.[3] || !message_split?.[4] || !message_split?.[5]) {
				continue;
			}
			
			// Create a new Message from the message and push it to the array of all messages.
			let message = new ChatStats.classes.Message(message_split[0], message_split[2], message_split[3], message_split[4], message_split[5]);
			ChatStats.messages.push(message);
			
			// If the message belongs to an unknown player create a new Player for them and push them to the array of known players as well as their id to the known player ids arrays.
			if (!ChatStats.known_player_ids.includes(message.player_id)) {
				ChatStats.known_player_ids.push(message.player_id);
				ChatStats.known_players.push(new ChatStats.classes.Player(message.player_id));
			}
			
			// Push the message to the player's array of messages and update their known names.
			let player = ChatStats.known_players.find((player) => player.id === message.player_id)
			player.messages.push(message);
			if (!player.names.includes(message.name)) {
				player.names.push(message.name);
				player.names.sort();
			}
		}
	}
	
	// If things have been done in the wrong order, run the filters now.
	if (ChatStats.helpers.filters_flag) {
		await ChatStats.name_filter_change();
		ChatStats.message_filter_change();
		ChatStats.date_filter_change();
		
	}
	
	ChatStats.helpers.enable_input();
}

ChatStats.name_filter_change = async function() {
	ChatStats.helpers.disable_input();
	
	let name_filter = (await document.getElementById('name_filter_file').files[0]?.text() ?? '');
	if (name_filter === '') {
		for (let message of ChatStats.messages) {
			message.filter.name = true;
		}
		ChatStats.helpers.enable_input();
		return;
	}
	name_filter = name_filter.split(/[\t\n\r,]+/);
	let filter_cutoff = document.getElementById('name_filter_cutoff').value / 100;
	for (let player of ChatStats.known_players) {
		let flag = false;
		for (const name of name_filter) {
			for (const player_name of player.names) {
				if (ChatStats.helpers.similarity(name, player_name) >= filter_cutoff) {
					flag = true;
					break;
				}
			}
			if (flag) break;
		}
		for (let message of player.messages) {
			message.filter.name = flag;
		}
	}
	
	ChatStats.helpers.enable_input();
}

ChatStats.message_filter_change = function() {
	ChatStats.helpers.disable_input();
	
	let message_filter = document.getElementById('filter_message').value;
	if (message_filter === '') {
		for (let message of ChatStats.messages) {
			message.filter.content = true;
		}
		ChatStats.helpers.enable_input();
		return;
	} else if (/^\/.*\/[gimsuy]*$/.test(message_filter)) {
		message_filter = new RegExp(/(?<=^\/).*(?=\/[gimsuy]*$)/.exec(message_filter)[0], /(?<=^\/.*\/)[gimsuy]*$/g.exec(message_filter)[0])
	} else {
		message_filter = new RegExp(message_filter, 'i');
	}
	
	for (let message of ChatStats.messages) {
		message.filter.content = message_filter.test(message.content);
	}
	
	ChatStats.helpers.enable_input();
}

ChatStats.date_filter_change = function() {
	ChatStats.helpers.disable_input();
	
	let date_start = Date.parse(document.getElementById('date_start').value);
	let date_end = Date.parse(document.getElementById('date_end').value) + 86400000; // Add a day in ms to adjust for inclusivity.
	for (let message of ChatStats.messages) {
		let date_message = Date.parse(message.time);
		if (date_message <= date_start || date_message >= date_end) {
			message.filter.date = false;
		} else {
			message.filter.date = true;
		}
	}
	
	ChatStats.helpers.enable_input();
}

ChatStats.display = function() {
	ChatStats.helpers.disable_input();
	
	let players = ChatStats.known_players;
	
	// Reset the Output Display
	let output = document.getElementById('output').children[0];
	for (let i = output.children.length - 1; i > 0; i--) {
		output.children[i].remove();
	}
	
	// Populate the Output Display
	for (const player of players) {
		
		// Count a player's messages.
		let message_count = {
			TOTAL: 0,
			PUBLIC: 0,
			PARTY: 0,
			GUILD: 0,
			REPLY: 0,
			GROUP: 0
		}
		
		for (const message of player.messages) {
			// Don't count filtered messages.
			if (!message.filtered) continue;
			
			message_count.TOTAL++;
			message_count[message.chat]++;
		}
		
		// If a player's total filtered message count is 0. Don't add it to the output.
		if (message_count.TOTAL === 0) continue;
		
		// Populate a player's row.
		let newRow = document.createElement('tr');
		for (const chat of ['TOTAL', 'PUBLIC', 'PARTY', 'GUILD', 'REPLY', 'GROUP']) {
			let newCell = document.createElement('td');
			newCell.innerText = message_count[chat];
			newRow.appendChild(newCell);
		}
		let player_id = document.createElement('td');
		player_id.innerText = player.id;
		newRow.appendChild(player_id);
		let player_names = document.createElement('td');
		player_names.innerText = player.names.join(', ');
		newRow.appendChild(player_names);
		
		output.appendChild(newRow);
	}
	
	ChatStats.sort.ascending = 1;
	ChatStats.sort.column_index = 7;
	
	ChatStats.helpers.enable_input();
}

/******************************************************************************
 * Sorting
 *****************************************************************************/

ChatStats.sort = {};

ChatStats.sort.ascending = 1;
ChatStats.sort.column_index = 7;

ChatStats.sort.output = function(e) {
	if (ChatStats.helpers.input_is_disabled) {
		return;
	}
	
	ChatStats.helpers.disable_input();
	
	let output = document.getElementById('output').children[0];
	
	// Figure out the sort direction and the index of the column to sort by.
	let ascending = ChatStats.sort.ascending;
	let column_index;
	if (e) {
		column_index = [...output.rows[0].children].indexOf(this);
	} else {
		column_index = ChatStats.sort.column_index;
	}
	if (ChatStats.sort.column_index === column_index) {
		ascending = -1 * ascending;
	} else if (column_index < 6) {
		ascending = 1;
	} else {
		ascending = -1;
	}
	ChatStats.sort.ascending = ascending;
	ChatStats.sort.column_index = column_index;
	
	// Sort the rows.
	let rows = [...output.rows].slice(1, output.length);
	if (column_index < 7) {
		rows.sort((a, b) => ascending * (b.cells[column_index].innerText - a.cells[column_index].innerText));
	} else {
		rows.sort((a, b) => ascending * (new Intl.Collator('en').compare(b.cells[column_index].innerText, a.cells[column_index].innerText)));
	}
	
	// Reset the Output Display
	for (let i = output.children.length - 1; i > 0; i--) {
		output.children[i].remove();
	}
	
	// Reinsert the rows, now sorted.
	for (let i = 0; i < rows.length; i++) {
		output.appendChild(rows[i]);
	}
	
	ChatStats.helpers.enable_input();
}

/******************************************************************************
 * On Load Event
 *****************************************************************************/

window.addEventListener('load', () => {
	let today = new Date().toISOString().slice(0,10);
	let date_start = new Date();
	date_start.setDate(date_start.getDate()-28)
	date_start = date_start.toISOString().slice(0,10);
	document.getElementById('date_end').max = today;
	document.getElementById('date_start').max = today;
	document.getElementById('date_end').value = today;
	document.getElementById('date_start').value = date_start;
	
	for (let cell of document.getElementById('output').rows[0].cells) {
		cell.addEventListener('click', ChatStats.sort.output);
	}
});