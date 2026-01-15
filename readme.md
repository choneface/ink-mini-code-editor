# ink-mini-code-editor

> Code editor component with syntax highlighting for [Ink](https://github.com/vadimdemedes/ink) CLI applications.

## Install

```sh
npm install ink-mini-code-editor
```

## Usage

```jsx
import React, {useState} from 'react';
import {render, Box, Text} from 'ink';
import CodeEditor from 'ink-mini-code-editor';

const SQLEditor = () => {
	const [code, setCode] = useState('SELECT * FROM users WHERE id = 1');

	return (
		<Box flexDirection="column">
			<Text>SQL Query Editor:</Text>
			<Box>
				<Text>{'> '}</Text>
				<CodeEditor
					value={code}
					onChange={setCode}
					placeholder="Enter SQL query..."
					language="sql"
					onSubmit={(val) => {
						console.log('Submitted:', val);
					}}
				/>
			</Box>
		</Box>
	);
};

render(<SQLEditor />);
```

## Props

### value

Type: `string`

Value to display in the code editor.

### placeholder

Type: `string`

Text to display when `value` is empty.

### focus

Type: `boolean`\
Default: `true`

Listen to user's input. Useful in case there are multiple input components at the same time and input must be "routed" to a specific component.

### showCursor

Type: `boolean`\
Default: `true`

Whether to show cursor and allow navigation inside the editor with arrow keys.

### highlightPastedText

Type: `boolean`\
Default: `false`

Highlight pasted text.

### mask

Type: `string`

Replace all chars and mask the value. Useful for password inputs.

```jsx
<CodeEditor value="secret" mask="*" />
//=> "******"
```

### onChange

Type: `Function`

Function to call when value updates.

### language

Type: `string`

Language for syntax highlighting (e.g., `'sql'`, `'javascript'`, `'python'`). When not specified, no syntax highlighting is applied.

```jsx
<CodeEditor value={code} onChange={setCode} language="sql" />
```

### onSubmit

Type: `Function`

Function to call when `Enter` is pressed, where first argument is the value of the input.

### getSuggestion

Type: `(value: string) => string | undefined`

Function that returns an autocomplete suggestion based on the current value. The suggestion should be the complete text (including what's already typed). When a valid suggestion is returned, a grey ghost text appears showing the remainder of the suggestion. Press the right arrow key to accept the suggestion.

```jsx
const getSuggestion = (value) => {
	const commands = ['select * from users', 'insert into table', 'delete from table'];
	return commands.find(cmd => cmd.startsWith(value) && cmd !== value);
};

<CodeEditor value={code} onChange={setCode} getSuggestion={getSuggestion} />
// User types "sel" → displays: sel|ect * from users (grey ghost text)
// User presses → → value becomes "select * from users"
```

### onSuggestionAccept

Type: `(accepted: string) => void`

Callback function called when a suggestion is accepted via the right arrow key. The accepted suggestion string is passed as the argument.

## Uncontrolled usage

This component also exposes an [uncontrolled](https://reactjs.org/docs/uncontrolled-components.html) version, which handles `value` changes for you. To receive the final input value, use `onSubmit` prop. Initial value can be specified via `initialValue` prop.

```jsx
import React from 'react';
import {render, Box, Text} from 'ink';
import {UncontrolledTextInput} from 'ink-mini-code-editor';

const SQLEditor = () => {
	const handleSubmit = (query) => {
		// Execute query
	};

	return (
		<Box flexDirection="column">
			<Text>SQL Query Editor:</Text>
			<Box>
				<Text>{'> '}</Text>
				<UncontrolledTextInput
					initialValue="SELECT * FROM"
					placeholder="Enter SQL query..."
					onSubmit={handleSubmit}
				/>
			</Box>
		</Box>
	);
};

render(<SQLEditor />);
```

## Development

Run the demo:

```sh
npm run dev
```

## License

MIT
