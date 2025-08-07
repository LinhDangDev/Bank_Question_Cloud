import 'katex/dist/katex.min.css';
import katex from 'katex';

/**
 * Parse group question content and extract summary information
 * @param content - Raw content with markup [<sg>], [<egc>], {<1>}, etc.
 * @returns Object with summary and full content
 */
export const parseGroupQuestionContent = (content: string): {
    summary: string;
    fullContent: string;
    isGroupQuestion: boolean;
    questionRange?: string;
    questionType?: 'reading' | 'fill-in-blank' | 'standard';
} => {
    if (!content) return { summary: '', fullContent: '', isGroupQuestion: false };

    // Check if it's a group question
    const isGroupQuestion = content.includes('[<sg>]') || content.includes('{<') || content.includes('Questions') || content.includes('(<1>)');

    if (!isGroupQuestion) {
        return { summary: content, fullContent: content, isGroupQuestion: false };
    }

    // Extract content between [<sg>] and [<egc>] or [</sg>]
    const sgMatch = content.match(/\[<sg>\]([\s\S]*?)(\[<egc>\]|\[<\/sg>\])/);
    let mainContent = sgMatch ? sgMatch[1].trim() : content;

    // Determine question type
    let questionType: 'reading' | 'fill-in-blank' | 'standard' = 'standard';
    if (content.includes('{<') && content.includes('>}')) {
        questionType = 'fill-in-blank';
    } else if (content.includes('Questions') || content.includes('passage') || content.includes('đoạn văn')) {
        questionType = 'reading';
    }

    // Extract question range from patterns like "Questions {<1>} – {<5>}" or "Questions {<1>} - {<5>}"
    const rangeMatch = mainContent.match(/Questions\s*\{<(\d+)>\}\s*[–-]\s*\{<(\d+)>\}/i);
    let questionRange = '';
    let summary = '';

    if (rangeMatch) {
        const startNum = rangeMatch[1];
        const endNum = rangeMatch[2];
        questionRange = `${startNum}-${endNum}`;

        // Create summary by replacing the range pattern with actual numbers
        summary = mainContent.replace(/Questions\s*\{<\d+>\}\s*[–-]\s*\{<\d+>\}/i, `Câu hỏi ${startNum}-${endNum}`);
    } else {
        // Try to extract range from Vietnamese pattern or child question numbering
        const vietnameseRangeMatch = mainContent.match(/Câu\s*(\d+)\s*[-–]\s*(\d+)/);
        if (vietnameseRangeMatch) {
            questionRange = `${vietnameseRangeMatch[1]}-${vietnameseRangeMatch[2]}`;
        } else {
            // Try to detect from child question patterns like (<1>), (<2>), etc.
            const childMatches = mainContent.match(/\(<(\d+)>\)/g);
            if (childMatches && childMatches.length > 1) {
                const numbers = childMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
                const minNum = Math.min(...numbers);
                const maxNum = Math.max(...numbers);
                questionRange = `${minNum}-${maxNum}`;
            }
        }

        // Create summary based on question type
        if (questionType === 'fill-in-blank') {
            summary = 'Câu hỏi điền khuyết';
        } else if (questionType === 'reading') {
            summary = 'Câu hỏi đọc hiểu';
        } else {
            summary = mainContent.length > 100 ? mainContent.substring(0, 100) + '...' : mainContent;
        }
    }

    // Clean up the summary by removing any remaining markup
    summary = summary
        .replace(/\{<\d+>\}/g, '') // Remove {<number>} patterns
        .replace(/\[<[^>]*>\]/g, '') // Remove [<markup>] patterns
        .replace(/\(<\d+>\)/g, '') // Remove (<number>) patterns
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    return {
        summary,
        fullContent: mainContent,
        isGroupQuestion: true,
        questionRange,
        questionType
    };
};

/**
 * Clean up unwanted characters and patterns from content
 * @param content - Raw content to clean
 * @returns Cleaned content
 */
export const cleanContent = (content: string): string => {
    if (!content) return '';

    return content
        .replace(/^\s*\[\s*$/, '') // Remove standalone [ at the beginning
        .replace(/^\s*\]\s*$/, '') // Remove standalone ] at the beginning
        .replace(/\[\s*\]/g, '') // Remove empty brackets
        .replace(/^\s*\[\s*/, '') // Remove [ at the very beginning
        .replace(/\s*\]\s*$/, '') // Remove ] at the very end
        .trim();
};

/**
 * Format child question content by removing (<number>) pattern and cleaning up
 * @param content - Raw child question content
 * @param questionNumber - The question number to display
 * @returns Formatted content
 */
export const formatChildQuestionContent = (content: string, questionNumber: number): string => {
    if (!content) return '';

    // Remove the (<number>) pattern from the beginning and clean up unwanted characters
    let processedContent = content.replace(/^\s*\(<\d+>\)\s*/, ''); // Remove (<number>) pattern

    // Handle [<br>] tags - convert to HTML line breaks
    processedContent = processedContent.replace(/\[<br>\]/g, '<br/>');

    // Clean up structural markup
    processedContent = processedContent.replace(/\[<egc>\]/g, '');
    processedContent = processedContent.replace(/\[<\/sg>\]/g, '');

    // Clean up unwanted characters
    processedContent = cleanContent(processedContent);

    // If the content is very short (likely just answer options), add question prefix
    if (processedContent.length < 50 && !processedContent.includes('A.') && !processedContent.includes('B.')) {
        processedContent = `<span class="text-sm text-gray-600 font-medium">Câu ${questionNumber}:</span> ${processedContent}`;
    }

    return processedContent;
};

/**
 * Format parent question content by replacing {<number>} with styled placeholders
 * @param content - Raw parent question content
 * @returns Formatted content with styled placeholders
 */
export const formatParentQuestionContent = (content: string): string => {
    if (!content) return '';

    // Clean up unwanted characters first
    let processedContent = cleanContent(content);

    // Handle [<br>] tags - convert to HTML line breaks
    processedContent = processedContent.replace(/\[<br>\]/g, '<br/>');

    // Handle [<egc>] tags - remove them as they're structural markers
    processedContent = processedContent.replace(/\[<egc>\]/g, '');
    processedContent = processedContent.replace(/\[<\/sg>\]/g, '');

    // Replace {<number>} with styled blank spaces for fill-in-blank questions
    processedContent = processedContent.replace(/\{<(\d+)>\}/g, (_, number) => {
        return `<span class="inline-block bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-400 px-4 py-2 mx-1 rounded-lg text-blue-700 font-semibold min-w-[80px] text-center shadow-sm hover:shadow-md transition-shadow">
            <span class="text-xs text-blue-500">Câu</span> <span class="text-lg">${number}</span>
        </span>`;
    });

    // Replace {<number>}_____ patterns with more styled blanks
    processedContent = processedContent.replace(/\{<(\d+)>\}_+/g, (_, number) => {
        return `<span class="inline-block bg-yellow-50 border-b-3 border-dashed border-yellow-400 px-4 py-1 mx-1 text-yellow-700 font-medium min-w-[100px] text-center">
            <span class="text-xs">Điền ${number}</span>
        </span>`;
    });

    return processedContent;
};

export const renderLatex = (content: string): string => {
    if (!content) return '';

    try {
        // Xử lý các công thức LaTeX phổ biến trước khi tiếp tục
        let processedContent = content;

        // Xử lý riêng các công thức binom
        processedContent = processedContent.replace(/\\binom\{([^}]*)\}\{([^}]*)\}/g, (match) => {
            try {
                const rendered = katex.renderToString(match, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });
                return `<span class="katex-formula">${rendered}</span>`;
            } catch (e) {
                console.error('Error rendering binom:', match, e);
                return match;
            }
        });

        // Xử lý các công thức tích phân với giới hạn
        processedContent = processedContent.replace(/\\int(_[^\s^]+)?(\^[^\s_]+)?/g, (match) => {
            try {
                const rendered = katex.renderToString(match, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });
                return `<span class="katex-formula">${rendered}</span>`;
            } catch (e) {
                console.error('Error rendering integral:', match, e);
                return match;
            }
        });

        // Xử lý sqrt
        processedContent = processedContent.replace(/\\sqrt\{([^}]*)\}/g, (match) => {
            try {
                const rendered = katex.renderToString(match, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                    strict: false
                });
                return `<span class="katex-formula">${rendered}</span>`;
            } catch (e) {
                console.error('Error rendering sqrt:', match, e);
                return match;
            }
        });

        // Handle LaTeX with HTML style attributes (like colored math)
        const styledLatexRegex = /(\\[a-zA-Z]+\{[^}]*\})"?\s*style="([^"]+)">(\\[a-zA-Z]+\{[^}]*\})/g;
        processedContent = processedContent.replace(styledLatexRegex, (match, formula1, style, formula2) => {
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

        // Cải thiện xử lý cho các mẫu ma trận
        // Xác định các ma trận với các loại dấu ngoặc khác nhau và xử lý đặc biệt
        // Xử lý ma trận trong $$ ... $$ hoặc trong \[ ... \] hoặc trong $ ... $
        const matrixPatterns = [
            // Các mẫu ma trận
            /\\\[\s*\\begin\{(p|b|v|V|)matrix\}[\s\S]*?\\end\{(p|b|v|V|)matrix\}\s*\\\]/g,
            /\$\$\s*\\begin\{(p|b|v|V|)matrix\}[\s\S]*?\\end\{(p|b|v|V|)matrix\}\s*\$\$/g,
            /\$\s*\\begin\{(p|b|v|V|)matrix\}[\s\S]*?\\end\{(p|b|v|V|)matrix\}\s*\$/g,

            // Xử lý ma trận độc lập
            /\\begin\{(p|b|v|V|)matrix\}[\s\S]*?\\end\{(p|b|v|V|)matrix\}/g,
        ];

        // Xử lý từng loại ma trận
        matrixPatterns.forEach(pattern => {
            processedContent = processedContent.replace(pattern, (match) => {
                try {
                    // Chuẩn hóa ma trận để KaTeX có thể xử lý tốt hơn
                    let normalizedMatrix = match
                        // Đảm bảo dấu ngắt dòng thích hợp trong ma trận
                        .replace(/\\\\(?!\n)/g, '\\\\\n')
                        // Đảm bảo khoảng cách thích hợp trong ma trận
                        .replace(/&(?!\s)/g, '& ');

                    // Xác định nếu đây là ma trận hiển thị (trong $$ hoặc \[)
                    const isDisplayMode = match.startsWith('$$') || match.startsWith('\\[');

                    // Biến đổi ma trận để nó hiển thị đúng
                    const rendered = katex.renderToString(
                        // Nếu ma trận chưa được bao trong $ $ hoặc \[ \], thêm vào
                        match.startsWith('\\begin') ? `\\displaystyle ${normalizedMatrix}` : normalizedMatrix,
                        {
                            throwOnError: false,
                            output: 'html',
                            displayMode: isDisplayMode,
                            strict: false,
                            trust: true
                        }
                    );

                    return `<div class="${isDisplayMode ? 'katex-display' : 'katex-formula'}">${rendered}</div>`;
                } catch (e) {
                    console.error('Error rendering matrix:', match, e);
                    return match;
                }
            });
        });

        // Enhanced math symbol processing for better recognition
        // Convert Unicode math symbols to LaTeX first
        processedContent = processedContent
            .replace(/∫/g, '\\int')
            .replace(/π/g, '\\pi')
            .replace(/∞/g, '\\infty')
            .replace(/±/g, '\\pm')
            .replace(/≤/g, '\\leq')
            .replace(/≥/g, '\\geq')
            .replace(/≠/g, '\\neq')
            .replace(/≈/g, '\\approx')
            .replace(/²/g, '^2')
            .replace(/³/g, '^3')
            .replace(/⁴/g, '^4')
            .replace(/⁵/g, '^5')
            .replace(/₀/g, '_0')
            .replace(/₁/g, '_1')
            .replace(/₂/g, '_2')
            .replace(/₃/g, '_3')
            .replace(/√/g, '\\sqrt')
            .replace(/→/g, '\\rightarrow')
            .replace(/←/g, '\\leftarrow')
            .replace(/⇒/g, '\\Rightarrow')
            .replace(/⇐/g, '\\Leftarrow')
            .replace(/⇔/g, '\\Leftrightarrow');

        // Pre-process chemical formulas to make them more compatible with KaTeX
        // Replace chemical formulas like C_6H_12O_6 with proper LaTeX: C_{6}H_{12}O_{6}
        processedContent = processedContent.replace(/([A-Z][a-z]?)_(\d+)/g, '$1_{$2}');

        // Replace superscripts without braces like x^2 with proper LaTeX: x^{2}
        processedContent = processedContent.replace(/([A-Za-z0-9])(\^)(\d+|[a-zA-Z](?!\{))/g, '$1$2{$3}');

        // Fix specific patterns seen in the screenshots
        processedContent = processedContent.replace(/\\sqrt\{([a-z0-9])(\^)(\d+)\}/g, '\\sqrt{$1^{$3}}');

        // Fix common LaTeX patterns that might not be properly formatted
        // Fix a_{6}^{5} patterns
        processedContent = processedContent.replace(/([a-zA-Z])_\{(\d+)\}\^\{(\d+)\}/g, '$1_{$2}^{$3}');

        // Fix simple patterns like a_6^5 to a_{6}^{5}
        processedContent = processedContent.replace(/([a-zA-Z])_(\d+)\^(\d+)/g, '$1_{$2}^{$3}');

        // Fix sqrt patterns with variables
        processedContent = processedContent.replace(/\\sqrt\{([a-zA-Z])(\d+)\}/g, '\\sqrt{$1^{$2}}');

        // Fix patterns like V = 6a^{3} to ensure proper rendering
        processedContent = processedContent.replace(/([A-Z])\s*=\s*(\d+)([a-z])\^\{(\d+)\}/g, '$1 = $2$3^{$4}');

        // Enhanced pattern recognition for common math expressions
        // Fractions like 1/2, x/3, etc. (but be careful not to break URLs or dates)
        processedContent = processedContent.replace(/\b(\w+)\/(\w+)\b(?![\/\w])/g, '\\frac{$1}{$2}');

        // Integrals with bounds
        processedContent = processedContent.replace(/\\int_(\w+)\^(\w+)/g, '\\int_{$1}^{$2}');

        // Common trig functions
        processedContent = processedContent.replace(/\b(sin|cos|tan|ln|log|sqrt|lim)\s*\(([^)]+)\)/g, '\\$1($2)');

        // Absolute values
        processedContent = processedContent.replace(/\|([^|]+)\|/g, '\\left|$1\\right|');

        // Common mathematical expressions
        processedContent = processedContent.replace(/\b(dx|dy|dz|dt)\b/g, '\\,$1');

        // Fix common integral patterns
        processedContent = processedContent.replace(/∫([^∫]+)d([xyz])/g, '\\int $1 \\,d$2');

        // Fix derivative notation
        processedContent = processedContent.replace(/d\/d([xyz])/g, '\\frac{d}{d$1}');

        // Fix limit notation
        processedContent = processedContent.replace(/lim\s*([^→]+)→([^→\s]+)/g, '\\lim_{$1 \\to $2}');

        // Xử lý đặc biệt cho các công thức LaTeX được bọc bởi thẻ cụ thể
        const latexTagRegex = /<latex>(.*?)<\/latex>/gs;
        processedContent = processedContent.replace(latexTagRegex, (match, formula) => {
            try {
                const rendered = katex.renderToString(formula.trim(), {
                    throwOnError: false,
                    output: 'html',
                    displayMode: true,
                    strict: false
                });
                return `<div class="katex-display">${rendered}</div>`;
            } catch (e) {
                console.error('Error rendering LaTeX from tag:', formula, e);
                return match;
            }
        });

        // Cải thiện xử lý các biểu thức trong cặp $ ... $ và $$ ... $$
        const dollarPatterns = [
            /\$\$(.*?)\$\$/g,  // $$ ... $$ (display mode)
            /\$([^\$]+?)\$/g,  // $ ... $ (inline mode)
            /\\\[(.*?)\\\]/g,  // \[ ... \] (display mode)
            /\\\((.*?)\\\)/g,  // \( ... \) (inline mode)
        ];

        dollarPatterns.forEach((pattern, index) => {
            const isDisplayMode = index === 0 || index === 2; // $$ ... $$ or \[ ... \]

            processedContent = processedContent.replace(pattern, (match, formula) => {
                try {
                    // Xử lý ma trận trong các biểu thức
                    if (formula.includes('\\begin{matrix}') ||
                        formula.includes('\\begin{pmatrix}') ||
                        formula.includes('\\begin{bmatrix}') ||
                        formula.includes('\\begin{vmatrix}') ||
                        formula.includes('\\begin{Vmatrix}')) {

                        // Đã xử lý ở trên với matrixPatterns
                        return match;
                    }

                    const rendered = katex.renderToString(formula, {
                        throwOnError: false,
                        output: 'html',
                        displayMode: isDisplayMode,
                        strict: false
                    });

                    return `<div class="${isDisplayMode ? 'katex-display' : 'katex-formula'}">${rendered}</div>`;
                } catch (e) {
                    console.error(`Error rendering LaTeX formula: ${match}`, e);
                    return match;
                }
            });
        });

        // Comprehensive regex to match various LaTeX patterns
        const latexPatterns = [
            // Basic math commands with improved patterns
            /\\sum_\{[^}]*\}\^\{[^}]*\}/g,
            /\\prod_\{[^}]*\}\^\{[^}]*\}/g,
            /\\lim_\{[^}]*\}/g,
            /\\int_\{[^}]*\}\^\{[^}]*\}/g,
            /\\oint_\{[^}]*\}\^\{[^}]*\}/g,
            /\\binom\{[^}]*\}\{[^}]*\}/g,

            // Phân số - improved pattern
            /\\frac\{[^}]*\}\{[^}]*\}/g,

            // Căn bậc - improved patterns
            /\\sqrt\{[^}]*\}/g,
            /\\sqrt\[[0-9]+\]\{[^}]*\}/g,

            // Chỉ số và lũy thừa - improved patterns
            /[A-Za-z0-9]_\{[^}]*\}\^\{[^}]*\}/g,
            /[A-Za-z0-9]_\{[^}]*\}/g,
            /[A-Za-z0-9]\^\{[^}]*\}/g,

            // Simple subscripts and superscripts without braces
            /[A-Za-z0-9]_[A-Za-z0-9]/g,
            /[A-Za-z0-9]\^[A-Za-z0-9]/g,

            // Các hàm toán học - more specific patterns
            /\\sin\{[^}]*\}/g, /\\cos\{[^}]*\}/g, /\\tan\{[^}]*\}/g,
            /\\log\{[^}]*\}/g, /\\ln\{[^}]*\}/g, /\\exp\{[^}]*\}/g,
            /\\sin/g, /\\cos/g, /\\tan/g, /\\log/g, /\\ln/g, /\\exp/g,

            // Các chữ cái Hy Lạp - more comprehensive
            /\\alpha/g, /\\beta/g, /\\gamma/g, /\\delta/g, /\\epsilon/g, /\\zeta/g,
            /\\eta/g, /\\theta/g, /\\iota/g, /\\kappa/g, /\\lambda/g, /\\mu/g,
            /\\nu/g, /\\xi/g, /\\pi/g, /\\rho/g, /\\sigma/g, /\\tau/g,
            /\\upsilon/g, /\\phi/g, /\\chi/g, /\\psi/g, /\\omega/g,
            /\\Gamma/g, /\\Delta/g, /\\Theta/g, /\\Lambda/g, /\\Xi/g,
            /\\Pi/g, /\\Sigma/g, /\\Upsilon/g, /\\Phi/g, /\\Psi/g, /\\Omega/g,

            // Các biểu tượng toán học
            /\\times/g, /\\div/g, /\\pm/g, /\\mp/g, /\\cdot/g,
            /\\leq/g, /\\geq/g, /\\neq/g, /\\equiv/g, /\\approx/g,
            /\\in/g, /\\notin/g, /\\subset/g, /\\subseteq/g, /\\cup/g, /\\cap/g,

            // Các biểu thức logic
            /\\rightarrow/g, /\\Rightarrow/g, /\\leftrightarrow/g, /\\Leftrightarrow/g,
            /\\forall/g, /\\exists/g, /\\land/g, /\\lor/g, /\\neg/g,

            // Các biến đổi và vector
            /\\vec\{[^}]*\}/g,
            /\\overrightarrow\{[^}]*\}/g,
            /\\overleftarrow\{[^}]*\}/g,
            /\\overline\{[^}]*\}/g,
            /\\underline\{[^}]*\}/g,
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

                // Skip if match is already wrapped in katex-formula
                if (processedContent.includes(`<span class="katex-formula">${match}</span>`)) {
                    return;
                }

                // Special handling for matrices to ensure proper rendering
                let latexToRender = match;

                // Fix common matrix issues
                if (latexToRender.includes('\\begin{') && latexToRender.includes('\\end{')) {
                    // Đã xử lý ở trên
                    return;
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
                console.error(`Error rendering LaTeX pattern: ${match}`, e);
                // Keep original text if rendering fails
                return;
            }
        });

        return processedContent;

    } catch (error) {
        console.error('Error in renderLatex:', error);
        return content; // Return original content in case of error
    }
};

/**
 * Enhanced LaTeX detection and processing
 */
export const hasAdvancedMathContent = (content: string): boolean => {
    const mathIndicators = [
        /\$.*?\$/,                    // Dollar signs
        /\\\w+/,                      // LaTeX commands
        /\^[\w\{\}]/,                 // Superscripts
        /_[\w\{\}]/,                  // Subscripts
        /\\frac\{.*?\}\{.*?\}/,       // Fractions
        /\\sqrt\{.*?\}/,              // Square roots
        /\\int/,                      // Integrals
        /\\sum/,                      // Summations
        /\\prod/,                     // Products
        /\\lim/,                      // Limits
        /[∫∑∏√π∞±≤≥≠≈]/,             // Unicode math symbols
        /\{<\d+>\}/,                  // Fill-in-blank placeholders
        /[a-zA-Z]\^\d+/,              // Simple exponents like x^2
        /[a-zA-Z]_\d+/,               // Simple subscripts like a_1
        /\d+\/\d+/,                   // Simple fractions like 1/2
        /\b(sin|cos|tan|ln|log|sqrt|lim)\s*\(/,  // Math functions
        /\b(dx|dy|dz|dt)\b/,          // Differential notation
        /[²³⁴⁵⁶⁷⁸⁹⁰]/,             // Unicode superscripts
        /[₀₁₂₃₄₅₆₇₈₉]/,             // Unicode subscripts
    ];

    return mathIndicators.some(pattern => pattern.test(content));
};

/**
 * Smart LaTeX renderer that detects and processes mathematical content
 */
export const smartRenderLatex = (content: string): string => {
    if (!content) return '';

    // If no math content detected, return as-is
    if (!hasAdvancedMathContent(content)) {
        return content;
    }

    // Use the enhanced renderLatex function
    return renderLatex(content);
};

/**
 * Render LaTeX content in a DOM element
 * @param element - The DOM element to process
 */
export const renderLatexInElement = (element: HTMLElement): void => {
    if (!element) return;

    // Find all potential LaTeX formula containers
    const latexElements = element.querySelectorAll('.katex-formula');

    // Process each element
    latexElements.forEach(el => {
        try {
            const formula = el.textContent || '';
            const rendered = katex.renderToString(formula, {
                throwOnError: false,
                output: 'html',
                displayMode: false,
                strict: false
            });

            // Replace the element's content with rendered LaTeX
            el.innerHTML = rendered;
        } catch (error) {
            console.error('Error rendering LaTeX in element:', error);
        }
    });

    // Also look for inline LaTeX formulas within text (enclosed in $ or $$)
    const processTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const text = node.textContent;

            // Check for inline LaTeX ($ formula $)
            if (text.includes('$')) {
                const parent = node.parentNode;
                if (!parent) return;

                // Split text by LaTeX delimiters
                const segments = text.split(/(\$[^$]+\$|\$\$[^$]+\$\$)/g);
                if (segments.length > 1) {
                    // Create a document fragment to hold the processed content
                    const fragment = document.createDocumentFragment();

                    segments.forEach(segment => {
                        // Check if this segment is a LaTeX formula
                        const isInline = segment.startsWith('$') && segment.endsWith('$') && !segment.startsWith('$$');
                        const isDisplay = segment.startsWith('$$') && segment.endsWith('$$');

                        if (isInline || isDisplay) {
                            try {
                                // Extract the formula (remove the delimiters)
                                const formula = isInline
                                    ? segment.substring(1, segment.length - 1)
                                    : segment.substring(2, segment.length - 2);

                                // Render the formula
                                const rendered = katex.renderToString(formula, {
                                    throwOnError: false,
                                    displayMode: isDisplay,
                                    strict: false
                                });

                                // Create an element to hold the rendered LaTeX
                                const span = document.createElement('span');
                                span.className = 'katex-inline';
                                span.innerHTML = rendered;
                                fragment.appendChild(span);
                            } catch (error) {
                                // On error, just add the original text
                                fragment.appendChild(document.createTextNode(segment));
                                console.error('Error rendering inline LaTeX:', error);
                            }
                        } else {
                            // Not a LaTeX formula, just add as text
                            fragment.appendChild(document.createTextNode(segment));
                        }
                    });

                    // Replace the original text node with our processed fragment
                    parent.replaceChild(fragment, node);
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Process child nodes recursively, but skip already processed nodes
            const element = node as Element;
            if (!element.classList || !element.classList.contains('katex-inline')) {
                Array.from(node.childNodes).forEach(processTextNodes);
            }
        }
    };

    // Process all text nodes in the element
    processTextNodes(element);
};
