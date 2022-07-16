let ChatStats = {}

ChatStats.Player = class Player {
	constructor(id) {
		this.id = id;
		this.messages = [];
		this.names = [];
	}
}

ChatStats.Message = class Message {
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

// Data Storages
ChatStats.known_players = [];
ChatStats.known_player_ids = [];
ChatStats.messages = [];

ChatStats.upload_logs = async function () {
	// Reset everything.
	ChatStats.known_players = [];
	ChatStats.known_player_ids = [];
	ChatStats.messages = [];
	
	const chat_log_files = document.getElementById('chat_log_files').files;
	
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
			let message = new ChatStats.Message(message_split[0], message_split[2], message_split[3], message_split[4], message_split[5]);
			ChatStats.messages.push(message);
			
			// If the message belongs to an unknown player create a new Player for them and push them to the array of known players as well as their id to the known player ids arrays.
			if (!ChatStats.known_player_ids.includes(message.player_id)) {
				ChatStats.known_player_ids.push(message.player_id);
				ChatStats.known_players.push(new ChatStats.Player(message.player_id));
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
}

ChatStats.name_filter_change = async function() {
	let name_filter = (await document.getElementById('filter_file').files[0]?.text() ?? '');
	if (name_filter === '') {
		return;
	}
	name_filter = name_filter.split(/[\t\n\r,]+/);
	let filter_cutoff = document.getElementById('filter_cutoff').value;
	for (let player of ChatStats.known_players) {
		let flag = false;
		for (const name of name_filter) {
			for (const player_name of player.names) {
				if (similarity(name, player_name) >= filter_cutoff) {
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
}

ChatStats.message_filter_change = function() {
	let message_filter = document.getElementById('filter_message').value;
	if (message_filter === '') {
		return;
	} else if (/^\/.*\/[gimsuy]*$/.test(message_filter)) {
		message_filter = new RegExp(/(?<=^\/).*(?=\/[gimsuy]*$)/.exec(message_filter)[0], /(?<=^\/.*\/)[gimsuy]*$/g.exec(message_filter)[0])
	} else {
		message_filter = new RegExp(message_filter, 'i');
	}
	
	for (let message of ChatStats.messages) {
		message.filter.content = message_filter.test(message.content);
	}
}

ChatStats.date_filter_change = function() {
	let date_start = Date.parse(document.getElementById('date_start').value);
	let date_end = Date.parse(document.getElementById('date_end').value) + 86400000; // Add a day in ms to adjust for inclusivity.
	for (let message of ChatStats.messages) {
		let date_message = Date.parse(message.time);
		if (date_message <= date_start || date_message >= date_end) message.filter.date = false;
	}
}

ChatStats.display = function() {
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
}

window.addEventListener('load', () => {
	let today = new Date().toISOString().slice(0,10);
	let two_weeks_ago = new Date();
	two_weeks_ago.setDate(two_weeks_ago.getDate()-28)
	two_weeks_ago = two_weeks_ago.toISOString().slice(0,10);
	document.getElementById('date_end').max = today;
	document.getElementById('date_start').max = today;
	document.getElementById('date_end').value = today;
	document.getElementById('date_start').value = two_weeks_ago;
});