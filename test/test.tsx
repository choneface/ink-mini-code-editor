import React, {useState} from 'react';
import test from 'ava';
import chalk from 'chalk';
import {render} from 'ink-testing-library';
import {spy} from 'sinon';
import delay from 'delay';
import TextInput, {UncontrolledTextInput} from '../source/index.js';

const noop = () => {
	/* */
};

const cursor = chalk.inverse(' ');
const enter = '\r';
const arrowLeft = '\u001B[D';
const arrowRight = '\u001B[C';
const del = '\u007F';

test('default state', t => {
	const {lastFrame} = render(<TextInput value="" onChange={noop} />);

	t.is(lastFrame(), cursor);
});

test('display value', t => {
	const {lastFrame} = render(
		<TextInput value="Hello" showCursor={false} onChange={noop} />,
	);

	t.is(lastFrame(), 'Hello');
});

test('display value with cursor', t => {
	const {lastFrame} = render(<TextInput value="Hello" onChange={noop} />);

	t.is(lastFrame(), `Hello${cursor}`);
});

test('display placeholder', t => {
	const {lastFrame} = render(
		<TextInput value="" placeholder="Placeholder" onChange={noop} />,
	);

	t.is(lastFrame(), chalk.inverse('P') + chalk.grey('laceholder'));
});

test('display placeholder when cursor is hidden', t => {
	const {lastFrame} = render(
		<TextInput
			value=""
			placeholder="Placeholder"
			showCursor={false}
			onChange={noop}
		/>,
	);

	t.is(lastFrame(), chalk.grey('Placeholder'));
});

test('display value with mask', t => {
	const {lastFrame} = render(
		<TextInput value="Hello" mask="*" onChange={noop} />,
	);

	t.is(lastFrame(), `*****${chalk.inverse(' ')}`);
});

test('accept input (controlled)', async t => {
	function StatefulTextInput() {
		const [value, setValue] = useState('');

		return <TextInput value={value} onChange={setValue} />;
	}

	const {stdin, lastFrame} = render(<StatefulTextInput />);

	t.is(lastFrame(), cursor);
	await delay(100);
	stdin.write('X');
	await delay(100);
	t.is(lastFrame(), `X${cursor}`);
});

test('accept input (uncontrolled)', async t => {
	const {stdin, lastFrame} = render(<UncontrolledTextInput />);

	t.is(lastFrame(), cursor);
	await delay(100);
	stdin.write('X');
	await delay(100);
	t.is(lastFrame(), `X${cursor}`);
});

test('initial value (uncontrolled)', async t => {
	const {stdin, lastFrame} = render(<UncontrolledTextInput initialValue="Y" />);

	t.is(lastFrame(), `Y${cursor}`);
	await delay(100);
	stdin.write('X');
	await delay(100);
	t.is(lastFrame(), `YX${cursor}`);
});

test('ignore input when not in focus', async t => {
	function StatefulTextInput() {
		const [value, setValue] = useState('');

		return <TextInput focus={false} value={value} onChange={setValue} />;
	}

	const {stdin, frames, lastFrame} = render(<StatefulTextInput />);

	t.is(lastFrame(), '');
	await delay(100);
	stdin.write('X');
	await delay(100);
	t.is(frames.length, 1);
});

test('ignore input for Tab and Shift+Tab keys', async t => {
	function Test() {
		const [value, setValue] = useState('');

		return <TextInput value={value} onChange={setValue} />;
	}

	const {stdin, lastFrame} = render(<Test />);

	await delay(100);
	stdin.write('\t');
	await delay(100);
	t.is(lastFrame(), cursor);
	stdin.write('\u001B[Z');
	await delay(100);
	t.is(lastFrame(), cursor);
});

test('onSubmit', async t => {
	const onSubmit = spy();

	function StatefulTextInput() {
		const [value, setValue] = useState('');

		return <TextInput value={value} onChange={setValue} onSubmit={onSubmit} />;
	}

	const {stdin, lastFrame} = render(<StatefulTextInput />);

	t.is(lastFrame(), cursor);

	await delay(100);
	stdin.write('X');
	await delay(100);
	stdin.write(enter);
	await delay(100);

	t.is(lastFrame(), `X${cursor}`);
	t.true(onSubmit.calledWith('X'));
	t.true(onSubmit.calledOnce);
});

test('paste and move cursor', async t => {
	function StatefulTextInput() {
		const [value, setValue] = useState('');

		return <TextInput highlightPastedText value={value} onChange={setValue} />;
	}

	const {stdin, lastFrame} = render(<StatefulTextInput />);

	await delay(100);
	stdin.write('A');
	await delay(100);
	stdin.write('B');
	await delay(100);
	t.is(lastFrame(), `AB${cursor}`);

	stdin.write(arrowLeft);
	await delay(100);
	t.is(lastFrame(), `A${chalk.inverse('B')}`);

	stdin.write('Hello World');
	await delay(100);
	t.is(lastFrame(), `A${chalk.inverse('Hello WorldB')}`);

	stdin.write(arrowRight);
	await delay(100);
	t.is(lastFrame(), `AHello WorldB${cursor}`);
});

test('delete at the beginning of text', async t => {
	function Test() {
		const [value, setValue] = useState('');

		return <TextInput value={value} onChange={setValue} />;
	}

	const {stdin, lastFrame} = render(<Test />);

	await delay(100);
	stdin.write('T');
	await delay(100);
	stdin.write('e');
	await delay(100);
	stdin.write('s');
	await delay(100);
	stdin.write('t');
	stdin.write(arrowLeft);
	await delay(100);
	stdin.write(arrowLeft);
	await delay(100);
	stdin.write(arrowLeft);
	await delay(100);
	stdin.write(arrowLeft);
	await delay(100);
	stdin.write(del);
	await delay(100);

	t.is(lastFrame(), `${chalk.inverse('T')}est`);
});

test('adjust cursor when text is shorter than last value', async t => {
	function Test() {
		const [value, setValue] = useState('');
		const submit = () => {
			setValue('');
		};

		return <TextInput value={value} onChange={setValue} onSubmit={submit} />;
	}

	const {stdin, lastFrame} = render(<Test />);

	await delay(100);
	stdin.write('A');
	await delay(100);
	stdin.write('B');
	await delay(100);
	t.is(lastFrame(), `AB${chalk.inverse(' ')}`);
	stdin.write('\r');
	await delay(100);
	t.is(lastFrame(), chalk.inverse(' '));
	stdin.write('A');
	await delay(100);
	t.is(lastFrame(), `A${chalk.inverse(' ')}`);
	stdin.write('B');
	await delay(100);
	t.is(lastFrame(), `AB${chalk.inverse(' ')}`);
});

test('display ghost text suggestion', t => {
	const getSuggestion = (value: string) => {
		if (value === 'sel') {
			return 'select * from users';
		}

		return undefined;
	};

	const {lastFrame} = render(
		<TextInput value="sel" getSuggestion={getSuggestion} onChange={noop} />,
	);

	t.is(lastFrame(), `sel${chalk.inverse(' ')}${chalk.dim('ect * from users')}`);
});

test('no ghost text when suggestion equals value', t => {
	const getSuggestion = () => 'hello';

	const {lastFrame} = render(
		<TextInput value="hello" getSuggestion={getSuggestion} onChange={noop} />,
	);

	t.is(lastFrame(), `hello${cursor}`);
});

test('no ghost text when cursor not at end', async t => {
	function Test() {
		const [value, setValue] = useState('sel');
		const getSuggestion = (v: string) => {
			if (v.startsWith('sel')) {
				return 'select * from users';
			}

			return undefined;
		};

		return (
			<TextInput
				value={value}
				getSuggestion={getSuggestion}
				onChange={setValue}
			/>
		);
	}

	const {stdin, lastFrame} = render(<Test />);

	// Initially cursor is at end, so ghost text should appear
	t.is(lastFrame(), `sel${chalk.inverse(' ')}${chalk.dim('ect * from users')}`);

	// Move cursor left - ghost text should disappear
	await delay(100);
	stdin.write(arrowLeft);
	await delay(100);
	t.is(lastFrame(), `se${chalk.inverse('l')}`);
});

test('accept suggestion with right arrow', async t => {
	const onSuggestionAccept = spy();

	function Test() {
		const [value, setValue] = useState('sel');
		const getSuggestion = (v: string) => {
			if (v.startsWith('sel')) {
				return 'select * from users';
			}

			return undefined;
		};

		return (
			<TextInput
				value={value}
				getSuggestion={getSuggestion}
				onChange={setValue}
				onSuggestionAccept={onSuggestionAccept}
			/>
		);
	}

	const {stdin, lastFrame} = render(<Test />);

	// Initially shows ghost text
	t.is(lastFrame(), `sel${chalk.inverse(' ')}${chalk.dim('ect * from users')}`);

	// Press right arrow to accept suggestion
	await delay(100);
	stdin.write(arrowRight);
	await delay(100);

	// Full suggestion should now be the value
	t.is(lastFrame(), `select * from users${cursor}`);
	t.true(onSuggestionAccept.calledWith('select * from users'));
	t.true(onSuggestionAccept.calledOnce);
});
