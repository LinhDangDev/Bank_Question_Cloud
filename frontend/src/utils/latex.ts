import 'katex/dist/katex.min.css';
import katex from 'katex';

export const renderLatex = (content: string): string => {
    try {
        // Handle LaTeX with HTML style attributes (like colored math)
        const styledLatexRegex = /(\\[a-zA-Z]+\{[^}]*\})"?\s*style="([^"]+)">(\\[a-zA-Z]+\{[^}]*\})/g;
        let processedContent = content.replace(styledLatexRegex, (match, formula1, style, formula2) => {
            try {
                // Extract color from style if present
                const colorMatch = style.match(/color:\s*([^;]+)/);
                const color = colorMatch ? colorMatch[1] : '';

                // Render both formulas separately with the specified color
                const rendered1 = katex.renderToString(formula1, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });

                const rendered2 = katex.renderToString(formula2, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });

                // Return with appropriate styling
                return `<span class="katex-formula" style="color:${color}">${rendered1}</span><span class="katex-formula" style="color:${color}">${rendered2}</span>`;
            } catch (e) {
                console.error('Error rendering styled LaTeX:', match, e);
                return match;
            }
        });

        // Handle LaTeX with HTML style attributes but without closing tag
        const singleStyledLatexRegex = /(\\[a-zA-Z]+\{[^}]*\})"?\s*style="([^"]+)"/g;
        processedContent = processedContent.replace(singleStyledLatexRegex, (match, formula, style) => {
            try {
                // Extract color from style if present
                const colorMatch = style.match(/color:\s*([^;]+)/);
                const color = colorMatch ? colorMatch[1] : '';

                // Render formula with the specified color
                const rendered = katex.renderToString(formula, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });

                // Return with appropriate styling
                return `<span class="katex-formula" style="color:${color}">${rendered}</span>`;
            } catch (e) {
                console.error('Error rendering single styled LaTeX:', match, e);
                return match;
            }
        });

        // Pre-process chemical formulas to make them more compatible with KaTeX
        // Replace chemical formulas like C_6H_12O_6 with proper LaTeX: C_{6}H_{12}O_{6}
        processedContent = processedContent.replace(/([A-Z][a-z]?)_(\d+)/g, '$1_{$2}');

        // Replace superscripts without braces like x^2 with proper LaTeX: x^{2}
        processedContent = processedContent.replace(/([A-Za-z0-9])(\^)(\d+|[a-zA-Z](?!\{))/g, '$1$2{$3}');

        // Fix specific patterns seen in the screenshots
        processedContent = processedContent.replace(/\\sqrt\{([a-z0-9])(\^)(\d+)\}/g, '\\sqrt{$1^{$3}}');

        // Comprehensive regex to match various LaTeX patterns
        const latexPatterns = [
            // Basic math commands
            /\\[a-zA-Z]+\{.*?\}/g,
            /\\[a-zA-Z]+_[a-zA-Z0-9]+/g,
            /\\[a-zA-Z]+_\{.*?\}/g,
            /\\[a-zA-Z]+\^\{.*?\}/g,
            /\\[a-zA-Z]+/g,

            // Matrix notation (with special handling)
            /\\begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\}/g,
            /\\begin\{matrix\}[\s\S]*?\\end\{matrix\}/g,
            /\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}/g,
            /\\begin\{vmatrix\}[\s\S]*?\\end\{vmatrix\}/g,
            /\\begin\{Vmatrix\}[\s\S]*?\\end\{Vmatrix\}/g,

            // Specific math expressions
            /\\exists.*?\\in.*?\\mathbb\{[A-Z]\}.*?[<>=]/g,
            /\\forall.*?\\ge 0/g,
            /\\sum.*?\\frac\{.*?\}\{.*?\}/g,
            /\\log_.*?\\iff/g,
            /\\lim_.*?= 1/g,
            /\\mathcal\{L\}.*?dt/g,
            /\\vec\{.*?\}/g,
            /\\binom\{.*?\}\{.*?\}/g,

            // Chemical formulas (enhanced)
            /[A-Z][a-z]?_\{[0-9]+\}[A-Z][a-z]?_\{[0-9]+\}[A-Z]?[a-z]?_?\{?[0-9]*\}?/g,
            /[A-Z][a-z]?\{.*?\}\d*/g,

            // Integrals
            /\\int_\{.*?\}\^\{.*?\}/g,
            /\\int_\{.*?\}/g,
            /\\int\^\{.*?\}/g,
            /\\int/g,

            // Fractions
            /\\frac\{.*?\}\{.*?\}/g,

            // Subscripts and superscripts (enhanced)
            /[A-Za-z0-9]_\{.*?\}\^\{.*?\}/g,
            /[A-Za-z0-9]_\{.*?\}/g,
            /[A-Za-z0-9]\^\{.*?\}/g,
            /[A-Za-z0-9]_[0-9a-zA-Z]/g,
            /[A-Za-z0-9]\^[0-9a-zA-Z]/g,

            // Greek letters
            /\\[a-zA-Z]+/g,

            // Special functions
            /\\sqrt\{.*?\}/g,
            /\\overline\{.*?\}/g,
            /\\underline\{.*?\}/g,

            // Sets and logic
            /\\in|\\subset|\\subseteq|\\cup|\\cap|\\emptyset|\\rightarrow|\\Rightarrow|\\Leftrightarrow|\\land|\\lor|\\neg/g,

            // Additional patterns for the specific cases in screenshots
            /\\sqrt\{[^}]+\}/g,
            /\\sqrt\{[a-z0-9]\^[0-9]+\}/g,
            /\\sqrt\{[a-z0-9]\^\{[0-9]+\}\}/g,
            /\\sqrt\{[a-z0-9]\^[0-9]+ \+ [a-z0-9]\^[0-9]+\}/g,
            /\\sqrt\{[a-z0-9]\^\{[0-9]+\} \+ [a-z0-9]\^\{[0-9]+\}\}/g
        ];

        // Find all matches from all patterns
        let allMatches: string[] = [];
        latexPatterns.forEach(pattern => {
            const matches = processedContent.match(pattern);
            if (matches) {
                allMatches = [...allMatches, ...matches];
            }
        });

        // Remove duplicates
        const uniqueMatches = [...new Set(allMatches)];

        // Sort by length (longest first) to avoid nested replacements
        uniqueMatches.sort((a, b) => b.length - a.length);

        // Replace each match with rendered LaTeX
        uniqueMatches.forEach(match => {
            try {
                // Skip if the match contains HTML style attributes (already processed above)
                if (match.includes('style=')) {
                    return;
                }

                // Special handling for matrices to ensure proper rendering
                let latexToRender = match;

                // Fix common matrix issues
                if (latexToRender.includes('\\begin{') && latexToRender.includes('\\end{')) {
                    // Ensure proper line breaks in matrices
                    latexToRender = latexToRender.replace(/\\\\(?!\n)/g, '\\\\\n');
                    // Ensure proper spacing in matrices
                    latexToRender = latexToRender.replace(/&(?!\s)/g, '& ');
                }

                const rendered = katex.renderToString(latexToRender, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false // Less strict mode to handle more expressions
                });

                // Create a safe regex pattern from the match
                const safePattern = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                processedContent = processedContent.replace(safePattern, `<span class="katex-formula">${rendered}</span>`);
            } catch (e) {
                console.error('Error rendering specific LaTeX:', match, e);
            }
        });

        return processedContent;
    } catch (e) {
        console.error('Error processing LaTeX:', e);
        return content;
    }
};
