import React, {useState, useEffect} from 'react';
import {Text, useInput, type TextProps} from 'ink';
import chalk from 'chalk';
import type {Except} from 'type-fest';
import SyntaxHighlight from 'ink-syntax-highlight';

/**
 * Decoration style preset names.
 */
export type DecorationStyle = 'error' | 'warning' | 'info' | 'highlight';

/**
 * A decoration that highlights a range of text with custom styles.
 */
export type Decoration = {
	/**
	 * Start character index (0-indexed, inclusive).
	 */
	start: number;
	/**
	 * End character index (exclusive).
	 */
	end: number;
	/**
	 * Preset style to apply.
	 */
	style: DecorationStyle;
};

/**
 * Style mappings for decoration presets.
 */
const decorationStyles: Record<DecorationStyle, Partial<TextProps>> = {
	error: {color: 'red', underline: true},
	warning: {color: 'yellow', underline: true},
	info: {color: 'blue', underline: true},
	highlight: {backgroundColor: 'yellow'},
};

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

	/**
	 * Array of decorations to apply to the text.
	 * Each decoration highlights a range of text with a preset style.
	 * Decorations only work when `language` is specified (syntax highlighting mode).
	 */
	readonly decorations?: Decoration[];
};

/**
 * Merges multiple decoration styles into a single style object.
 * Later decorations in the array take precedence for conflicting properties.
 */
function mergeDecorationStyles(
	decorations: Decoration[],
): Partial<TextProps> | undefined {
	if (decorations.length === 0) return undefined;

	const merged: Partial<TextProps> = {};
	for (const dec of decorations) {
		const style = decorationStyles[dec.style];
		Object.assign(merged, style);
	}

	return merged;
}

/**
 * Represents a segment of text to render with specific styling.
 */
type Segment = {
	text: string;
	start: number;
	end: number;
	isCursor: boolean;
	decorations: Decoration[];
};

/**
 * Creates segments of text based on cursor position and decorations.
 * Each segment has a unique combination of styling needs.
 */
function createSegments(
	value: string,
	cursorOffset: number,
	decorations: Decoration[],
	showCursor: boolean,
): Segment[] {
	// Clamp decorations to valid bounds
	const clampedDecorations = decorations.map(dec => ({
		...dec,
		start: Math.max(0, Math.min(dec.start, value.length)),
		end: Math.max(0, Math.min(dec.end, value.length)),
	}));

	// Collect all split points
	const splitPoints = new Set<number>([0, value.length]);

	// Add cursor position as split point
	if (showCursor) {
		splitPoints.add(cursorOffset);
		if (cursorOffset < value.length) {
			splitPoints.add(cursorOffset + 1);
		}
	}

	// Add decoration boundaries
	for (const dec of clampedDecorations) {
		if (dec.start < dec.end) {
			splitPoints.add(dec.start);
			splitPoints.add(dec.end);
		}
	}

	// Sort and filter valid points
	const points = [...splitPoints]
		.sort((a, b) => a - b)
		.filter(p => p >= 0 && p <= value.length);

	// Create segments
	const segments: Segment[] = [];
	for (let i = 0; i < points.length - 1; i++) {
		const start = points[i]!;
		const end = points[i + 1]!;
		const text = value.slice(start, end);
		const isCursor =
			showCursor && start === cursorOffset && end === cursorOffset + 1;

		// Find decorations that overlap with this segment
		const appliedDecorations = clampedDecorations.filter(
			dec => dec.start < end && dec.end > start,
		);

		segments.push({
			text,
			start,
			end,
			isCursor,
			decorations: appliedDecorations,
		});
	}

	return segments;
}

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
	decorations = [],
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

		const cursorAtEnd = cursorOffset === value.length;

		// Use segment-based rendering for decorations support
		const segments = createSegments(
			value,
			cursorOffset,
			decorations,
			cursorVisible,
		);

		return (
			<Text>
				{segments.map(seg => {
					// Cursor segment takes precedence over decorations
					if (seg.isCursor) {
						return (
							<Text key={`cursor-${seg.start}`} inverse>
								{seg.text}
							</Text>
						);
					}

					// Get merged decoration styles for this segment
					const decorationStyle = mergeDecorationStyles(seg.decorations);

					if (decorationStyle) {
						// Render with decoration styles wrapping syntax highlight
						return (
							<Text key={`dec-${seg.start}`} {...decorationStyle}>
								<SyntaxHighlight language={language} code={seg.text} />
							</Text>
						);
					}

					// No decorations, just syntax highlight
					return (
						<SyntaxHighlight
							key={`seg-${seg.start}`}
							language={language}
							code={seg.text}
						/>
					);
				})}
				{cursorVisible && cursorAtEnd && <Text inverse> </Text>}
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
