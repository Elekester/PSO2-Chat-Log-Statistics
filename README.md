![Release v1.1.1](https://img.shields.io/github/v/release/elekester/pso2-chat-log-statistics)
![Test](images/NGSUIMenuChatCommandOutline.png)

Get some basic statistics from your PSO2 chat log files, including a player's message counts for each chat.

Visit the site at: https://elekester.github.io/PSO2-Chat-Log-Statistics/

# PSO2 Chat Log Statistics User Manual



## Uploading Chat Logs

![Chat Log Upload Area](images/upload%20area.png)

Towards the top of the page you will see a large box with a choose file dialog option. You can upload your chat log files either by dragging theme here or using the dialog option. You can find Phantasy Star Online 2's chat log files in the log and log_ngs folders wherever your PSO2 documents folder is. If you have installed PSO2 through steam this will be located in C:\Users\USERNAME\Documents\SEGA\PHANTASYSTARONLINE2_NA_STEAM.

![File Explorer](images/file%20select.png)

You can upload any of the files located here and the program simply ignores any file that isn't a (symbol) chat log file.

## Filtering the Chat Logs

![Filter Area](images/filter%20area.png)

By default, all the data found in the uploaded files will be present in the statistics. If you wish to filter out some of the messages you can add a filter here by clicking on the plus. Only messages that pass all the filters will be present in the statistics. Clicking on a filter's label will reopen that filter's settings.

At the moment there are three filters available.

### Name/ID Filter

![Name/ID Filter](images/name%20ID%20filter.png)

Filter messages by the Character or Player Name or the Player ID of the player who sent the message.

- List of Names: A comma or tab separated list of player and/or character names. Only messages sent by a player with one of these names will pass the filter.
- Name Match Threshold: A number from 0 to 100 which allows for names to match any name that is close to a name on the list. The smaller the number put, the closer the two names have to be. It's a good idea to put a small number here to allow for spelling errors.
- List of Player IDs: A comma or tab separated list of Player IDs. Only messages sent by a player with one of these IDs will pass the filter.
- Match Name OR ID: If checked messages will pass the filter if it passes either the name or ID filter. If unchecked a message will only pass the filter if it passes the name and ID filter.

### Content Filter

![Content Filter](images/content%20filter.png)

Filter messages by their content.

- Message Text: A string of text. Only messages that include the string in their content will pass the filter.
- Is RegEx: If checked the above Message Text will be treated as a regular expression and only those messages that match the regex will pass the filter.
- RegEx Flags: If the message text is a regular expression, these flags will be applied to it.

### Date Filter

![Date Filter](images/date%20filter.png)

- Start Date: A date. Only messages sent on or after this date will pass the filter.
- End Date: A date. Only messages sent on or before this date will pass the filter.

## Output

![Output Example](images/output%20area.png)

Once you've uploaded your chat logs and selected your filters, hit calculate to display your statistics.

Your data will be displayed in a table like the example below. Clicking on a header will sort the table by that column. Clicking it again will reverse the sort.

The column names are derived from the internal names for each of the chats.

* The Total column displays the total message count for each player.
* The Public column displays the Area message count for each player.
* The Party column displays the Party message count for each player.
* The Guild column displays the Alliance Message Count for each player.
* The Reply column displays the Whisper Message Count for each player.
* The Group column displays the Group Message Count for each player.
* The Player ID column displays the unique number associated to each player's account.
* The Names column displays the Player Names and Character Names associated to each player's account. The names are sorted by frequency, from most common to least.

### Downloading the Statistics

You can download the displayed table as a csv file by clicking the download button.

You may also download a single combined chat log by ctrl-clicking the download button.
