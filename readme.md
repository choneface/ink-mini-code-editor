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

### onSubmit

Type: `Function`

Function to call when `Enter` is pressed, where first argument is the value of the input.

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
