/******************************************************************************
 * Welcome to script.js, where all the magic happens.
 *
 * If you're adding a new filter, add it to the Message class's filter
 *   property, its get filtered method and make sure that
 *   ChatStats.chat_logs_change runs it at the end if filter_flag is true.
 *****************************************************************************/

let ChatStats = {};

ChatStats.init = function() {	
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
		constructor(time, chat, player_id, name, content) {
			this.time = time;
			this.chat = chat;
			this.player_id = player_id;
			this.name = name;
			this.content = content;
			this.filters = {
			}
		}
		
		get passed_filters() {
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
		callback([...event.dataTransfer.files]);
	}
	
	ChatStats.utilities.drop_over_handler = function(event) {
		event.preventDefault();
	}
	
	/******************************************************************************
	 * ChatStats.data
	 *****************************************************************************/
	ChatStats.data = {};
	
	ChatStats.data.players = [];
	ChatStats.data.player_ids = [];
	ChatStats.data.messages = [];
	
	/******************************************************************************
	 * ChatStats.main
	 *****************************************************************************/
	ChatStats.main = {};
	
	ChatStats.main.chat_log_files_change = async function(files) {
		// Disable Input
		[...document.getElementsByTagName('input')].forEach(element => {element.disabled = true;});
		
		files ??= [...document.getElementById('chat_log_files').files];
		
		for (const file of files) {
			document.getElementById('chat_log_files_indicator').innerHTML++;
		}
		
		// Enable Input
		[...document.getElementsByTagName('input')].forEach(element => {element.disabled = false;});
	}
	
	ChatStats.main.update_output = function() {
	}
	
	ChatStats.main.download_output = function() {
	}
	
	ChatStats.main.reset_all = function() {
		// Disable Input
		[...document.getElementsByTagName('input')].forEach(element => {element.disabled = true;});
		
		document.getElementById('chat_log_files_indicator').innerText = 0;
		
		// Enable Input
		[...document.getElementsByTagName('input')].forEach(element => {element.disabled = false;});
	}
	
	/******************************************************************************
	 * Cleanup
	 *****************************************************************************/
	
	window.removeEventListener('load', ChatStats.init);
}

window.addEventListener('load', ChatStats.init);