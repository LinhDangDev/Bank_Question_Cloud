import 'katex/dist/katex.min.css';
import katex from 'katex';

export const renderLatex = (content: string): string => {
    if (!content) return '';

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

        // Pre-process chemical formulas to make them more compatible with KaTeX
        // Replace chemical formulas like C_6H_12O_6 with proper LaTeX: C_{6}H_{12}O_{6}
        processedContent = processedContent.replace(/([A-Z][a-z]?)_(\d+)/g, '$1_{$2}');

        // Replace superscripts without braces like x^2 with proper LaTeX: x^{2}
        processedContent = processedContent.replace(/([A-Za-z0-9])(\^)(\d+|[a-zA-Z](?!\{))/g, '$1$2{$3}');

        // Fix specific patterns seen in the screenshots
        processedContent = processedContent.replace(/\\sqrt\{([a-z0-9])(\^)(\d+)\}/g, '\\sqrt{$1^{$3}}');

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
            // Basic math commands
            /\\sum_\{.*?\}\^\{.*?\}/g,
            /\\prod_\{.*?\}\^\{.*?\}/g,
            /\\lim_\{.*?\}/g,
            /\\int_\{.*?\}\^\{.*?\}/g,
            /\\oint_\{.*?\}\^\{.*?\}/g,

            // Phân số
            /\\frac\{.*?\}\{.*?\}/g,

            // Căn bậc
            /\\sqrt\{.*?\}/g,
            /\\sqrt\[[0-9]+\]\{.*?\}/g,

            // Ma trận - đã được xử lý ở trên

            // Chỉ số và lũy thừa
            /[A-Za-z0-9]_\{.*?\}\^\{.*?\}/g,
            /[A-Za-z0-9]_\{.*?\}/g,
            /[A-Za-z0-9]\^\{.*?\}/g,

            // Các hàm toán học
            /\\[a-z]+\{.*?\}/g,

            // Các chữ cái Hy Lạp
            /\\[a-zA-Z]+(?![a-zA-Z])/g,

            // Các biểu tượng toán học
            /\\(times|div|pm|mp|cdot|leq|geq|neq|equiv|approx|in|notin|subset|subseteq|cup|cap)/g,

            // Các biểu thức logic
            /\\(rightarrow|Rightarrow|leftrightarrow|Leftrightarrow|forall|exists)/g,

            // Các biến đổi và vector
            /\\vec\{.*?\}/g,
            /\\overrightarrow\{.*?\}/g,
            /\\overleftarrow\{.*?\}/g,
            /\\overline\{.*?\}/g,
            /\\underline\{.*?\}/g,
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
                console.error('Error rendering specific LaTeX:', match, e);
            }
        });

        // Xử lý đặc biệt cho các công thức cụ thể trong ảnh mà bạn gửi
        // Mẫu trong \sum_{d}^{adsa}
        processedContent = processedContent.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, (match, lower, upper) => {
            try {
                const rendered = katex.renderToString(`\\sum_{${lower}}^{${upper}}`, {
                    throwOnError: false,
                    output: 'html',
                    displayMode: false,
                });
                return `<span class="katex-formula">${rendered}</span>`;
            } catch (e) {
                return match;
            }
        });

        return processedContent;
    } catch (e) {
        console.error('Error processing LaTeX:', e);
        return content;
    }
};
