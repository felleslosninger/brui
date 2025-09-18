import type { Context } from '../../../core/types/context';

export function setupUI(context: Context) {
    const input = document.getElementById('input') as HTMLInputElement;
    const button = document.getElementById('submit') as HTMLButtonElement;
    const toggleButton = document.getElementById('toggleTools') as HTMLButtonElement;
    const availableTools = document.getElementById('availableTools') as HTMLDivElement;

    function populateAvailableTools() {
        const toolsList = document.querySelector('.tools-list');
        if (toolsList && context.container.tools) {
            toolsList.innerHTML = context.container.tools.map(tool => {
                const params = tool.function.parameters;
                const properties = params?.properties || {};
                const required = params?.required || [];

                const propertiesHtml = Object.entries(properties).map(([key, prop]: [string, any]) => {
                    const isRequired = required.includes(key);
                    return `
                        <div class="property-item">
                            <span class="property-name ${isRequired ? 'required' : 'optional'}">${key}</span>
                            <span class="property-type">${prop.type}</span>
                            ${prop.description ? `<span class="property-description">${prop.description}</span>` : ''}
                        </div>
                    `;
                }).join('');

                return `
                    <div class="tool-item">
                        <div class="tool-item-name">${tool.function.name}</div>
                        <div class="tool-item-description">${tool.function.description}</div>
                        ${propertiesHtml ? `
                            <div class="tool-properties">
                                <div class="properties-header">Parameters:</div>
                                ${propertiesHtml}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    // Toggle tools visibility
    toggleButton?.addEventListener('click', () => {
        availableTools?.classList.toggle('hidden');
        toggleButton.textContent = availableTools?.classList.contains('hidden')
            ? 'Available Tools'
            : 'Hide Tools';
    });

    // Initialize tools list
    populateAvailableTools();

    context.eventTarget.addEventListener('event:triggered', (e: any) => {
        const { type, name, args } = e.detail;
        const eventLog = document.getElementById('eventLog');

        if (eventLog) {
            eventLog.innerHTML = `
                <div class="tool-call">
                    <div class="tool-type">${type === 'function' ? 'Function' : 'Event'}</div>
                    <div class="tool-name">${name}</div>
                    <div class="tool-args">${JSON.stringify(args, null, 2)}</div>
                </div>
            `;
        }
    });

    function showReasoning() {
        const eventLog = document.getElementById('eventLog');
        if (eventLog) {
            eventLog.innerHTML = `
                <div class="reasoning-state">
                    <div class="reasoning-text">Reasoning...</div>
                </div>
            `;
        }
    }

    function showEmptyState() {
        const eventLog = document.getElementById('eventLog');
        if (eventLog) {
            eventLog.innerHTML = '<div class="empty-state">No tools used</div>';
        }
    }

    // Input handlers
    const emitUserInput = (message: string) => {
        context.eventTarget.dispatchEvent(new CustomEvent('core:userInput', { detail: { message } }));
    };

    button?.addEventListener('click', () => {
        if (input?.value.trim()) {
            emitUserInput(input.value);
            input.value = ''; // Clear input after sending
        }
    });

    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            emitUserInput(input.value);
            input.value = ''; // Clear input after sending
        }
    });

    return {
        showReasoning,
        showEmptyState
    };
}