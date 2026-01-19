import React, {useState, useMemo} from 'react';
import {render, Box, Text} from 'ink';
import TextInput, {type Decoration} from './index.js';

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

// Common SQL typos/errors to detect
const sqlErrors: Array<{pattern: RegExp; replacement: string}> = [
	{pattern: /\bselct\b/gi, replacement: 'select'},
	{pattern: /\bfrom\s+form\b/gi, replacement: 'from'},
	{pattern: /\bwher\b/gi, replacement: 'where'},
	{pattern: /\binsrt\b/gi, replacement: 'insert'},
	{pattern: /\bupdat\b/gi, replacement: 'update'},
	{pattern: /\bdelet\b/gi, replacement: 'delete'},
	{pattern: /\btabel\b/gi, replacement: 'table'},
];

// Deprecated SQL patterns to warn about
const sqlWarnings: Array<{pattern: RegExp; message: string}> = [
	{pattern: /\bselect\s+\*\b/gi, message: 'Consider specifying columns'},
	{pattern: /\bdelete\s+from\s+\w+\s*$/gi, message: 'Missing WHERE clause'},
];

function Demo() {
	const [value, setValue] = useState('');
	const [submitted, setSubmitted] = useState<string[]>([]);

	const getSuggestion = (input: string) => {
		if (input.length === 0) return undefined;
		const lower = input.toLowerCase();
		return sqlCommands.find(cmd => cmd.startsWith(lower) && cmd !== lower);
	};

	// Generate decorations based on SQL validation
	const decorations = useMemo(() => {
		const decs: Decoration[] = [];

		// Check for typos/errors
		for (const {pattern} of sqlErrors) {
			const regex = new RegExp(pattern.source, pattern.flags);
			let match;
			while ((match = regex.exec(value)) !== null) {
				decs.push({
					start: match.index,
					end: match.index + match[0].length,
					style: 'error',
				});
			}
		}

		// Check for warnings
		for (const {pattern} of sqlWarnings) {
			const regex = new RegExp(pattern.source, pattern.flags);
			let match;
			while ((match = regex.exec(value)) !== null) {
				decs.push({
					start: match.index,
					end: match.index + match[0].length,
					style: 'warning',
				});
			}
		}

		return decs;
	}, [value]);

	const handleSubmit = (val: string) => {
		if (val.trim()) {
			setSubmitted(prev => [...prev, val]);
			setValue('');
		}
	};

	// Get error/warning messages for display
	const errorMessages = useMemo(() => {
		const messages: Array<{type: 'error' | 'warning'; text: string}> = [];

		for (const {pattern, replacement} of sqlErrors) {
			if (pattern.test(value)) {
				messages.push({
					type: 'error',
					text: `Typo: did you mean "${replacement}"?`,
				});
			}
		}

		for (const {pattern, message} of sqlWarnings) {
			if (pattern.test(value)) {
				messages.push({type: 'warning', text: message});
			}
		}

		return messages;
	}, [value]);

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				SQL Editor Demo (with autocomplete + decorations)
			</Text>
			<Text dimColor>
				Type a SQL command - suggestions appear in grey. Press right arrow to
				accept.
			</Text>
			<Text dimColor>
				Try typos like &quot;selct&quot; (error) or &quot;select *&quot;
				(warning).
			</Text>
			<Text dimColor>Press Enter to submit. Ctrl+C to exit.</Text>
			<Box marginTop={1}>
				<Text color="green">{`> `}</Text>
				<TextInput
					value={value}
					placeholder="Enter SQL query..."
					language="sql"
					getSuggestion={getSuggestion}
					decorations={decorations}
					onChange={setValue}
					onSubmit={handleSubmit}
					onSuggestionAccept={s => {
						setValue(s);
					}}
				/>
			</Box>
			{errorMessages.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					{errorMessages.map(msg => (
						<Text
							key={`${msg.type}-${msg.text}`}
							color={msg.type === 'error' ? 'red' : 'yellow'}
						>
							{msg.type === 'error' ? '✗' : '⚠'} {msg.text}
						</Text>
					))}
				</Box>
			)}
			{submitted.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold>History:</Text>
					{submitted.map((cmd, idx) => (
						<Text key={cmd} dimColor>
							{idx + 1}. {cmd}
						</Text>
					))}
				</Box>
			)}
		</Box>
	);
}

render(<Demo />);
