class Player {
	constructor(id) {
		this.id = id;
		this.messages = [];
		this.names = [];
		this.chats = {
			TOTAL: 0,
			PARTY: 0,
			PUBLIC: 0,
			GUILD: 0,
			REPLY: 0,
			GROUP: 0
		};
	}
	
	static temp_players = [];
	static file_change = false;
}

async function calculate() {
	let input = document.getElementById('chat_log_files').files;
	let name_filter = (await document.getElementById('filter_file').files[0]?.text() ?? '');
	let name_filter_check = name_filter === '' ? false : true;
	name_filter = name_filter.split(/[\t\n\r,]+/);
	let date_start = Date.parse(document.getElementById('date_start').value);
	let date_end = Date.parse(document.getElementById('date_end').value);
	
	let players = [];
	let player_ids = [];
	
	for (const file of input) {
		if (!file.name.includes('ChatLog') || !file.type === 'text/plain' || file.size > 10000000) continue;
		const value = await file.text()
		const array = value.replace(/\r/g,'').split('\n');
		for (const elem of array) {
			message = elem.split('\t');
			if (message[0] === '' || !message?.[3] || !message?.[4]) continue; /* Check for a message that contains no timestamp or Player ID or name. We'll skip those. */
			
			/* Apply the filters. */
			let date_message = Date.parse(message[0].slice(0,10));
			if (date_message <= date_start || date_message >= date_end) continue; /* Date filter. */
			if (name_filter_check && !player_ids.includes(message[3])) { /* Name filter. If Player ID is already associated with an name that passed the filter, ignore the filter.*/
				let filter_cutoff = document.getElementById('filter_cutoff').value;
				let flag = false;
				for (const name of name_filter) {
					if (similarity(name, message[4]) >= filter_cutoff) {
						flag = true;
						break;
					}
				}
				if (!flag) continue;
			}
			
			if (!player_ids.includes(message[3])) {
				player_ids.push(message[3]);
				players.push(new Player(message[3]));
			}
			player = players.find((player) => player.id === message[3])
			player.messages.push(message);
			if (!player.names.includes(message[4]) && message?.[4]) {player.names.push(message[4]); player.names.sort()};
			player.chats[message[2]]++;
			player.chats.TOTAL++;
		}
	}
	
	Player.temp_players = players;
	Player.file_change = false;
}

async function display() {
	document.getElementById('calculate_button_label').innerText = 'Calculating...';
	if (Player.file_change) await calculate();
	
	let players = Player.temp_players;
	let sort_method = document.getElementById('sort_method').value;
	
	if (sort_method === 'alphabetically') {
		players.sort((a, b) => {
			if (a?.names[0] && b?.names[0]) {return a.names[0].localeCompare(b.names[0], undefined, {sensitivity: 'base'});}
			else {return 0;}
		});
	} else if (sort_method.includes('_chat_count')) {
		let chat = sort_method.split('_', 1)[0];
		players.sort((a, b) => {
			if (!(isNaN(a?.chats?.[chat]) && isNaN(b?.chats?.[chat]))) {return b.chats[chat] - a.chats[chat];}
			else {return 0;}
		});
	} else if (sort_method === 'id') {
		players.sort((a, b) => {
			if (a?.id && b?.id) {return a.id - b.id;}
			else {return 0;}
		});
	}
	
	let output = document.getElementById('output').children[0];
	for (let i = output.children.length - 1; i > 0; i--) {
		output.children[i].remove();
	}
	for (const player of players) {
		let newRow = document.createElement('tr');
		for (const chat of ['TOTAL', 'PUBLIC', 'PARTY', 'GUILD', 'REPLY', 'GROUP']) {
			let newCell = document.createElement('td');
			newCell.innerText = player.chats[chat];
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
	document.getElementById('calculate_button_label').innerText = '';
}

/* Credit to overlord1234. https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely */
function editDistance(s1, s2) {
	s1 = s1.toLowerCase();
	s2 = s2.toLowerCase();

	var costs = new Array();
	for (var i = 0; i <= s1.length; i++) {
		var lastValue = i;
		for (var j = 0; j <= s2.length; j++) {
			if (i == 0)
				costs[j] = j;
			else {
				if (j > 0) {
					var newValue = costs[j - 1];
					if (s1.charAt(i - 1) != s2.charAt(j - 1))
						newValue = Math.min(Math.min(newValue, lastValue),
							costs[j]) + 1;
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
		}
		if (i > 0)
			costs[s2.length] = lastValue;
	}
	return costs[s2.length];
}

/* Credit to overlord1234. https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely */
function similarity(s1, s2) {
	var longer = s1;
	var shorter = s2;
	if (s1.length < s2.length) {
		longer = s2;
		shorter = s1;
	}
	var longerLength = longer.length;
	if (longerLength == 0) {
		return 1.0;
	}
	return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
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