export type MathfieldElement = HTMLElement & {
    value: string;
    virtualKeyboardMode?: string;
};

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'math-field': any;
        }
    }
}
export { };
