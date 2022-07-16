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
			player: true,
			content: true,
			date: true
		}
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

ChatStats.player_filter_change = function() {
	// Go through messages and mark those with a player associated to a filter name or Player ID as true and those who aren't as false. Remember to use the Sensitivity setting and edit distance.
}

ChatStats.message_filter_change = function() {
	// Go through the messages and mark those that pass the message filter as true, otherwise false.
}

ChatStats.date_filter_change = function() {
	// Go through the messages and mark those that are between the dates.
}

ChatStats.display = function() {
	let players = ChatStats.known_players;
	let sort_method = document.getElementById('sort_method').value;
	
	// Sort the Player list.
	if (sort_method === 'alphabetically') {
		players.sort((a, b) => {
			if (a?.names[0] && b?.names[0]) {return a.names[0].localeCompare(b.names[0], undefined, {sensitivity: 'base'});}
			else {return 0;}
		});
	} else if (sort_method.includes('_chat_count')) {
		let chat = sort_method.split('_', 1)[0];
		// players.sort((a, b) => {
			// if (!(isNaN(a?.chats?.[chat]) && isNaN(b?.chats?.[chat]))) {return b.chats[chat] - a.chats[chat];}
			// else {return 0;}
		// });
	} else if (sort_method === 'id') {
		players.sort((a, b) => {
			if (a?.id && b?.id) {return a.id - b.id;}
			else {return 0;}
		});
	}
	
	// Reset the Output Display
	let output = document.getElementById('output').children[0];
	for (let i = output.children.length - 1; i > 0; i--) {
		output.children[i].remove();
	}
	
	// Populate the Output Display
	for (const player of players) {
		let newRow = document.createElement('tr');
		for (const chat of ['TOTAL', 'PUBLIC', 'PARTY', 'GUILD', 'REPLY', 'GROUP']) {
			let newCell = document.createElement('td');
			newCell.innerText = 0;
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