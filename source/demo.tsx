import React, {useState} from 'react';
import {render, Box, Text} from 'ink';
import TextInput from './index.js';

const sqlCommands = [
	'select * from users',
	'select * from orders',
	'select id, name from users',
	'insert into users values',
	'update users set',
	'delete from users where',
	'create table',
	'drop table',
	'alter table',
];

function Demo() {
	const [value, setValue] = useState('');
	const [submitted, setSubmitted] = useState<string[]>([]);

	const getSuggestion = (input: string) => {
		if (input.length === 0) return undefined;
		const lower = input.toLowerCase();
		return sqlCommands.find(cmd => cmd.startsWith(lower) && cmd !== lower);
	};

	const handleSubmit = (val: string) => {
		if (val.trim()) {
			setSubmitted(prev => [...prev, val]);
			setValue('');
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				SQL Editor Demo (with autocomplete)
			</Text>
			<Text dimColor>
				Type a SQL command - suggestions appear in grey. Press right arrow to
				accept.
			</Text>
			<Text dimColor>Press Enter to submit. Ctrl+C to exit.</Text>
			<Box marginTop={1}>
				<Text color="green">{`> `}</Text>
				<TextInput
					value={value}
					placeholder="Enter SQL query..."
					language="sql"
					getSuggestion={getSuggestion}
					onChange={setValue}
					onSubmit={handleSubmit}
					onSuggestionAccept={s => {
						setValue(s);
					}}
				/>
			</Box>
			{submitted.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>History:</Text>
					{submitted.map(cmd => (
						<Text key={cmd} dimColor>
							{submitted.indexOf(cmd) + 1}. {cmd}
						</Text>
					))}
				</Box>
			)}
		</Box>
	);
}

render(<Demo />);
