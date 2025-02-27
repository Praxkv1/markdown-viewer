document.addEventListener('DOMContentLoaded', function() {
    // Fetch the markdown file
    fetch('string_operations.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(markdownContent => {
            // Parse the markdown content
            parseMarkdown(markdownContent);
        })
        .catch(error => {
            console.error('There was a problem fetching the markdown file:', error);
            document.getElementById('content').innerHTML = `
                <div class="error-message">
                    <h2>Error Loading Content</h2>
                    <p>There was a problem loading the markdown file: ${error.message}</p>
                    <p>Please make sure the file exists and the server allows file access.</p>
                </div>
            `;
        });
});

// Modified to apply markdown formatting to section titles as well
function parseMarkdown(markdown) {
    // Split the markdown into lines
    const lines = markdown.split('\n');
    
    // Structure to hold the parsed hierarchy
    const structure = {
        sections: [],
        currentSection: null,
        toc: []
    };
    
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeLanguage = '';
    let currentContent = '';
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we're in a code block or entering/exiting one
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            
            if (inCodeBlock) {
                // Extract the language
                codeLanguage = line.trim().substring(3).trim();
                continue;
            } else {
                // End of code block, add it to the current section
                if (structure.currentSection) {
                    structure.currentSection.content += `<pre><code class="language-${codeLanguage}">${escapeHtml(codeBlockContent)}</code></pre>`;
                }
                codeBlockContent = '';
                codeLanguage = '';
                continue;
            }
        }
        
        // If we're in a code block, collect the content
        if (inCodeBlock) {
            codeBlockContent += line + '\n';
            continue;
        }
        
        // Check for headers
        if (line.startsWith('#') && !line.trim().startsWith('```')) {
            // If there's accumulated content, add it to the current section
            if (currentContent.trim() && structure.currentSection) {
                structure.currentSection.content += currentContent;
                currentContent = '';
            }
            
            // Count the level of the header (number of # symbols)
            let level = 0;
            while (line[level] === '#' && level < line.length) {
                level++;
            }
            
            let title = line.substring(level).trim();
            const plainTitle = title; // Store plain version for ID generation
            
            // Apply markdown formatting to the title
            title = processLine(title);
            
            const id = plainTitle.toLowerCase().replace(/[^\w]+/g, '-');
            
            const newSection = {
                id: id,
                title: title,
                level: level,
                content: '',
                children: []
            };
            
            // Add to the proper place in the hierarchy
            if (level === 1) {
                structure.sections.push(newSection);
                structure.toc.push(newSection);
            } else {
                let parent = findParent(structure.sections, level - 1);
                if (parent) {
                    parent.children.push(newSection);
                } else {
                    // If no proper parent, add to top level
                    structure.sections.push(newSection);
                    structure.toc.push(newSection);
                }
            }
            
            structure.currentSection = newSection;
        } else {
            // Regular content, accumulate it
            currentContent += processLine(line) + '\n';
        }
    }
    
    // Add any remaining content to the current section
    if (currentContent.trim() && structure.currentSection) {
        structure.currentSection.content += currentContent;
    }
    
    // Render the tree view and content
    renderTreeView(structure.toc);
    renderContent(structure.sections);
    
    // Initialize Prism for syntax highlighting
    if (window.Prism) {
        Prism.highlightAll();
    }
}

// Helper function to find the parent section for a given level
function findParent(sections, parentLevel) {
    for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].level === parentLevel) {
            return sections[i];
        }
        
        const parent = findParent(sections[i].children, parentLevel);
        if (parent) {
            return parent;
        }
    }
    return null;
}

// Process a regular line of markdown (not a header or code block)
function processLine(line) {
    // Handle horizontal rules
    if (line.trim() === '---') {
        return '<hr>';
    }
    
    // Process inline Markdown formatting
    
    // Inline code: `code` - process this first to avoid conflicts with other formatting
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold: **text** or __text__
    line = line.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
    
    // Italic: *text* or _text_
    line = line.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
    
    // Links: [text](url)
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Unordered lists: - item or * item
    if (line.trim().match(/^[\*\-]\s/)) {
        line = '<li>' + line.trim().substring(2) + '</li>';
        // If the previous line wasn't a list item, wrap in <ul>
        if (!line.startsWith('<li>')) {
            line = '<ul>' + line;
        }
    }
    
    // Ordered lists: 1. item
    if (line.trim().match(/^\d+\.\s/)) {
        const index = line.indexOf('.');
        line = '<li>' + line.substring(index + 1).trim() + '</li>';
        // If the previous line wasn't a list item, wrap in <ol>
        if (!line.startsWith('<li>')) {
            line = '<ol>' + line;
        }
    }
    
    return line;
}

// Escape HTML special characters in code blocks
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Render the hierarchical tree view
function renderTreeView(sections) {
    const treeView = document.getElementById('tree-view');
    treeView.innerHTML = '<h2>Table of Contents</h2>' + buildTreeHTML(sections);
    
    // Add click events to tree items
    const toggles = document.querySelectorAll('.tree-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleTreeSection(this);
        });
    });
    
    // Add click events to navigate to section and expand tree
    const treeItems = document.querySelectorAll('.tree-item');
    treeItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const sectionId = this.getAttribute('data-section');
            
            // If this tree item has children (has a toggle button), expand/collapse it first
            const toggleButton = this.querySelector('.tree-toggle');
            if (toggleButton && e.target !== toggleButton) {
                toggleTreeSection(toggleButton);
            }
            
            // Navigate to the section
            document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
            
            // Update active state
            document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// New helper function to handle the toggling logic
function toggleTreeSection(toggleButton) {
    const parent = toggleButton.parentElement.parentElement;
    const ul = parent.querySelector('ul');
    const sectionId = toggleButton.parentElement.getAttribute('data-section');
    
    if (ul) {
        const isCollapsing = !ul.classList.contains('hidden');
        
        // Toggle the immediate children visibility in TOC
        ul.classList.toggle('hidden');
        toggleButton.textContent = isCollapsing ? '+' : '-';
        
        // Toggle corresponding content sections
        toggleContentSections(sectionId, isCollapsing);
        
        // More explicit way to handle all nested children when collapsing
        if (isCollapsing) {
            // Find ALL nested ULs and collapse them
            const allNestedUls = parent.querySelectorAll('ul');
            allNestedUls.forEach(nestedUl => {
                nestedUl.classList.add('hidden');
            });
            
            // Update ALL nested toggle buttons
            const allNestedToggles = parent.querySelectorAll('.tree-toggle');
            allNestedToggles.forEach(nestedToggle => {
                nestedToggle.textContent = '+';
            });
            
            // Also collapse all nested content sections
            const allChildSections = document.querySelectorAll(`.content-section[data-parent="${sectionId}"]`);
            allChildSections.forEach(section => {
                section.classList.add('hidden');
                
                // Also hide all descendants
                const descendants = document.querySelectorAll(`.content-section[data-ancestor="${sectionId}"]`);
                descendants.forEach(desc => {
                    desc.classList.add('hidden');
                });
            });
        }
    }
}

// Function to toggle content sections
function toggleContentSections(sectionId, isCollapsing) {
    const childSections = document.querySelectorAll(`.content-section[data-parent="${sectionId}"]`);
    
    childSections.forEach(section => {
        if (isCollapsing) {
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
        }
    });
}

// Build the HTML for the tree view
function buildTreeHTML(sections, level = 0) {
    if (!sections || sections.length === 0) return '';
    
    // Add 'hidden' class to all sublevels (level > 0)
    let html = `<ul class="${level > 0 ? 'hidden' : ''}">`;
    
    sections.forEach(section => {
        // Create a temporary element to strip HTML tags for tree view
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = section.title;
        const plainTitle = tempDiv.textContent || tempDiv.innerText;
        
        html += `<li>
            <div class="tree-item" data-section="${section.id}">
                ${section.children.length > 0 ? 
                    `<span class="tree-toggle">+</span>` : // Default to + for expandable items
                    '<span style="width:16px;display:inline-block;"></span>'}
                ${plainTitle}
            </div>
            ${buildTreeHTML(section.children, level + 1)}
        </li>`;
    });
    
    html += '</ul>';
    return html;
}

// Render the content sections
function renderContent(sections) {
    const contentElement = document.getElementById('content');
    contentElement.innerHTML = '<h2>Content</h2>';
    
    // Render top-level sections directly
    renderSections(sections, contentElement);
}

// Recursively render all sections and their children
function renderSections(sections, parentElement, parentId = null, ancestors = []) {
    sections.forEach(section => {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'section';
        sectionElement.id = section.id;
        
        // Add the header - using innerHTML instead of textContent to preserve formatting
        const headerElement = document.createElement(`h${section.level}`);
        headerElement.innerHTML = section.title; 
        sectionElement.appendChild(headerElement);
        
        // Add the content
        const contentElement = document.createElement('div');
        contentElement.className = 'markdown-content';
        contentElement.innerHTML = section.content;
        sectionElement.appendChild(contentElement);
        
        // Add to parent
        parentElement.appendChild(sectionElement);
        
        // Create wrapper for child sections
        if (section.children.length > 0) {
            const childContainer = document.createElement('div');
            childContainer.className = 'content-section';
            childContainer.setAttribute('data-parent', section.id);
            
            // Add ancestor information for deep nesting
            ancestors.forEach(ancestor => {
                childContainer.setAttribute('data-ancestor', ancestor);
            });
            
            // Start hidden for all child content if not top level
            if (section.level > 1) {
                childContainer.classList.add('hidden');
            }
            
            // Render children inside this container
            const newAncestors = [...ancestors, section.id];
            renderSections(section.children, childContainer, section.id, newAncestors);
            
            parentElement.appendChild(childContainer);
        }
    });
}
