import cl from 'clsx/lite';
import { useEffect, useRef, useState } from 'react';
import { Checkbox, Popover, Select } from '@digdir/designsystemet-react';
import { CogIcon, XMarkIcon } from '@navikt/aksel-icons';
import InputField from './InputField';
import InputSubmitButton from './InputSubmitButton';
import InputMicrophoneButton from './InputMicrophoneButton';
import { useSidebarContext } from '../SidebarContext';
import type { Mode } from '../../types/message';

type SidebarMode = 'Info' | 'Handling';

const SIDEBAR_MODES: readonly SidebarMode[] = ['Info', 'Handling'];

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
}

function SidebarInputRoot({ children, className }: SidebarInputProps) {
    const { handleSubmit, showThinking, setShowThinking, setAutoConfirm, includePageContext, pageContextActive, setPageContextActive, mic } = useSidebarContext();
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>('Info');
    const [statusMessage, setStatusMessage] = useState('');
    const isFirstRender = useRef(true);

    const contextChoice: Mode = sidebarMode === 'Info' ? 'Info' : 'Act';

    // Announce mic recording state changes — skip the initial mount
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        setStatusMessage(mic.recording ? 'Voice input active' : 'Voice input stopped');
    }, [mic.recording]);

    function handleModeChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const next = e.target.value;
        if (!SIDEBAR_MODES.includes(next as SidebarMode)) return;
        setSidebarMode(next as SidebarMode);
        setAutoConfirm(false);
        setStatusMessage(`Mode: ${next}`);
    }

    function handleShowThinkingChange(e: React.ChangeEvent<HTMLInputElement>) {
        setShowThinking(e.target.checked);
        setStatusMessage(e.target.checked ? 'Show reasoning on' : 'Show reasoning off');
    }

    function handlePageContextChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPageContextActive(e.target.checked);
        setStatusMessage(e.target.checked ? 'Page context on' : 'Page context off');
    }

    return (
        <div className={cl('brui-sidebar-input', className)}>
            {children ?? (
                <form onSubmit={handleSubmit} className="brui-sidebar-input-content">

                    {/* Single live region for all state-change announcements */}
                    <span role="status" aria-live="polite" className="brui-sr-only">
                        {statusMessage}
                    </span>

                    {mic.error && (
                        <div
                            className="brui-mic-error"
                            role="alert"
                        >
                            <span className="brui-mic-error-text">{mic.error.message}</span>
                            <button
                                type="button"
                                className="brui-mic-error-dismiss"
                                onClick={mic.dismissError}
                                aria-label="Dismiss"
                            >
                                <XMarkIcon aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    <div className='brui-sidebar-input-row'>
                        <SidebarInput.InputField/>
                    </div>
                    <div className='brui-sidebar-action-row'>
                        <div className='brui-sidebar-toggles'>
                            <Select
                                aria-label="Mode"
                                data-size="sm"
                                className="brui-mode-select"
                                value={sidebarMode}
                                onChange={handleModeChange}
                            >
                                <Select.Option value="Info">Info</Select.Option>
                                <Select.Option value="Handling">Handling</Select.Option>
                            </Select>

                            <Popover.TriggerContext>
                                <Popover.Trigger
                                    variant="secondary"
                                    data-size="sm"
                                    className="brui-settings-trigger"
                                    aria-label="Settings"
                                >
                                    <CogIcon className="brui-icon" aria-hidden="true" />
                                </Popover.Trigger>
                                <Popover data-size="sm" className="brui-settings-popover">
                                    <div className="brui-settings-items">
                                        <Checkbox
                                            label="Show reasoning"
                                            data-size="sm"
                                            checked={showThinking}
                                            onChange={handleShowThinkingChange}
                                        />
                                        {includePageContext && (
                                            <Checkbox
                                                label="Page context"
                                                data-size="sm"
                                                checked={pageContextActive}
                                                onChange={handlePageContextChange}
                                            />
                                        )}
                                    </div>
                                </Popover>
                            </Popover.TriggerContext>
                        </div>

                        <input type="hidden" name="contextChoice" value={contextChoice} />

                        <div className="brui-action-buttons">
                            <SidebarInput.Microphone/>
                            <SidebarInput.Submit/>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: InputSubmitButton
});

export default SidebarInput;
