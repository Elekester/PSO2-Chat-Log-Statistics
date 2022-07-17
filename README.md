# PSO2 Chat Log Statistics

Get some basic statistics from your chat log files, like total message count or all the names used by a Player Id.

## File Upload and Settings Menu

When you first get started you'll see the below box with the file uploads and settings to choose from with an empty output below.

![Options Menu Example](images/options_menu.png)

### 1. Chat Log Files Upload

You may select any number of files in the log or log_ngs folders in your PSO2 documents directory (same place that PSO2 stores native screenshots) to upload here. Files that aren't chat logs or symbol chat logs are simply skipped.

![File Selecting Example](images/file_select.png)

### 2. Name Filter File Upload

The name filter file is a plain text document containing names separated by a new line, tab, or comma. The results are limited to just those players who have a Player ID Name or Character Name in the filter.

```
ElekesterPrime,Nel, Elekester
Nett
```

Uploading more chat log files will increase the likelihood of the name filter catching players who use multiple characters with unknown names, but may increase the time required to perform calculations.

### 3. Name Filter Sensitivity

You can specify a sensitivity setting to allow for spelling errors in the name. The setting ranges from 0, which will accept all names as equivalent, to 100, which will only count exact spelling.

At 50 for example, Nel and Neol are treated as the same name, while at 80 they'd be two different names.

### 4. Message Filter

You can filter by message content. Only messages containing the given case-insensitive text will be included in the calculation. Alternatively you can set the message filter using a regular expression (will not work on Safari).

### 5. Date Filter

The results may also be filtered by message date. By default this is set to only include messages from the past four weeks, but can be set to as early as PSO2's launch date.

### 6. Calculate Button

Hit this button to calculate everything.
