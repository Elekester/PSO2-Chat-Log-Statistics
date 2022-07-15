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
			if (!message_split?.[0] || !message_split?.[1] || !message_split?.[2] || !message_split?.[3] || !message_split?.[4] || !message_split?.[5] || message_split[0] === '') {
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