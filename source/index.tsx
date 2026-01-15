import React, {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';
import SyntaxHighlight from 'ink-syntax-highlight';

export type Props = {
	/**
	 * Text to display when `value` is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Listen to user's input. Useful in case there are multiple input components
	 * at the same time and input must be "routed" to a specific component.
	 */
	readonly focus?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Replace all chars and mask the value. Useful for password inputs.
	 */
	readonly mask?: string;

	/**
	 * Whether to show cursor and allow navigation inside text input with arrow keys.
	 */
	readonly showCursor?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Highlight pasted text
	 */
	readonly highlightPastedText?: boolean; // eslint-disable-line react/boolean-prop-naming

	/**
	 * Value to display in a text input.
	 */
	readonly value: string;

	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: string) => void;

	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;

	/**
	 * Language for syntax highlighting (e.g., 'sql', 'javascript', 'python').
	 * When not specified, no syntax highlighting is applied.
	 */
	readonly language?: string;

	/**
	 * Function that returns an autocomplete suggestion based on the current value.
	 * The suggestion should be the complete text (including what's already typed).
	 * A grey ghost text will appear showing the remainder of the suggestion.
	 */
	readonly getSuggestion?: (value: string) => string | undefined;

	/**
	 * Callback when a suggestion is accepted (via right arrow key).
	 */
	readonly onSuggestionAccept?: (accepted: string) => void;
};

function TextInput({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	showCursor = true,
	onChange,
	onSubmit,
	language,
	getSuggestion,
	onSuggestionAccept,
}: Props) {
	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
	});

	const {cursorOffset, cursorWidth} = state;

	useEffect(() => {
		setState(previousState => {
			if (!focus || !showCursor) {
				return previousState;
			}

			const newValue = originalValue || '';

			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}

			return previousState;
		});
	}, [originalValue, focus, showCursor]);

	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;

	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (showCursor && focus) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');

		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

		let i = 0;

		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;

			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	}

	// Compute ghost text for autocomplete suggestion
	let ghostText = '';
	if (getSuggestion && focus && cursorOffset === originalValue.length) {
		const suggestion = getSuggestion(originalValue);
		if (
			suggestion &&
			suggestion.startsWith(originalValue) &&
			suggestion !== originalValue
		) {
			ghostText = suggestion.slice(originalValue.length);
		}
	}

	// Append ghost text in dim styling
	if (ghostText) {
		renderedValue += chalk.dim(ghostText);
	}

	useInput(
		(input, key) => {
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab ||
				(key.shift && key.tab)
			) {
				return;
			}

			if (key.return) {
				if (onSubmit) {
					onSubmit(originalValue);
				}

				return;
			}

			let nextCursorOffset = cursorOffset;
			let nextValue = originalValue;
			let nextCursorWidth = 0;

			if (key.leftArrow) {
				if (showCursor) {
					nextCursorOffset--;
				}
			} else if (key.rightArrow) {
				if (showCursor) {
					// Check if we should accept autocomplete suggestion
					if (cursorOffset === originalValue.length && getSuggestion) {
						const suggestion = getSuggestion(originalValue);
						if (
							suggestion &&
							suggestion.startsWith(originalValue) &&
							suggestion !== originalValue
						) {
							// Accept the suggestion
							nextValue = suggestion;
							nextCursorOffset = suggestion.length;
							onSuggestionAccept?.(suggestion);
						} else {
							nextCursorOffset++;
						}
					} else {
						nextCursorOffset++;
					}
				}
			} else if (key.backspace || key.delete) {
				if (cursorOffset > 0) {
					nextValue =
						originalValue.slice(0, cursorOffset - 1) +
						originalValue.slice(cursorOffset, originalValue.length);

					nextCursorOffset--;
				}
			} else {
				nextValue =
					originalValue.slice(0, cursorOffset) +
					input +
					originalValue.slice(cursorOffset, originalValue.length);

				nextCursorOffset += input.length;

				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			}

			if (cursorOffset < 0) {
				nextCursorOffset = 0;
			}

			if (cursorOffset > originalValue.length) {
				nextCursorOffset = originalValue.length;
			}

			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			if (nextValue !== originalValue) {
				onChange(nextValue);
			}
		},
		{isActive: focus},
	);

	const displayValue = placeholder
		? value.length > 0
			? renderedValue
			: renderedPlaceholder
		: renderedValue;

	// When syntax highlighting is enabled, use component-based rendering
	// to avoid ANSI code conflicts between chalk and the syntax highlighter
	if (language) {
		const showGhost = ghostText && focus && cursorOffset === value.length;
		const cursorVisible = showCursor && focus;

		// Empty value with placeholder
		if (value.length === 0 && placeholder) {
			return (
				<Text>
					{cursorVisible ? (
						<>
							<Text inverse>{placeholder[0] ?? ' '}</Text>
							<Text dimColor>{placeholder.slice(1)}</Text>
						</>
					) : (
						<Text dimColor>{placeholder}</Text>
					)}
				</Text>
			);
		}

		// Empty value without placeholder
		if (value.length === 0) {
			return cursorVisible ? <Text inverse> </Text> : <Text />;
		}

		const beforeCursor = value.slice(0, cursorOffset);
		const atCursor = value[cursorOffset] ?? '';
		const afterCursor = atCursor ? value.slice(cursorOffset + 1) : '';
		const cursorAtEnd = cursorOffset === value.length;

		return (
			<Text>
				{beforeCursor && (
					<SyntaxHighlight language={language} code={beforeCursor} />
				)}
				{cursorVisible && <Text inverse>{cursorAtEnd ? ' ' : atCursor}</Text>}
				{!cursorVisible && atCursor && (
					<SyntaxHighlight language={language} code={atCursor} />
				)}
				{afterCursor && (
					<SyntaxHighlight language={language} code={afterCursor} />
				)}
				{showGhost && <Text dimColor>{ghostText}</Text>}
			</Text>
		);
	}

	return <Text>{displayValue}</Text>;
}

export default TextInput;

type UncontrolledProps = {
	/**
	 * Initial value.
	 */
	readonly initialValue?: string;
} & Except<Props, 'value' | 'onChange'>;

export function UncontrolledTextInput({
	initialValue = '',
	...props
}: UncontrolledProps) {
	const [value, setValue] = useState(initialValue);

	return <TextInput {...props} value={value} onChange={setValue} />;
}
