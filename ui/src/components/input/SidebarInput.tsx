import cl from 'clsx/lite';
import { useState } from 'react';
import { Checkbox, Input } from '@digdir/designsystemet-react';
import InputField from './InputField';
import InputSubmitButton from './InputSubmitButton';
import InputMicrophoneButton from './InputMicrophoneButton';
import { useSidebarContext } from '../SidebarContext';
import type { Mode } from '../../types/message';

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
}

function SidebarInputRoot({ children, className }: SidebarInputProps) {
    const { handleSubmit, showThinking, setShowThinking, setAutoConfirm, includePageContext, pageContextActive, setPageContextActive } = useSidebarContext();
    const [actMode, setActMode] = useState(false);
    const [autoConfirm, setAutoConfirmLocal] = useState(false);
    const currentMode: Mode = actMode ? 'Act' : 'Info';

    function handleAutoConfirmChange(e: React.ChangeEvent<HTMLInputElement>) {
        const checked = e.target.checked;
        setAutoConfirmLocal(checked);
        setAutoConfirm(checked);
    }

    return (
        <div className={cl('brui-sidebar-input', className)}>
            {children ?? (
                <form onSubmit={handleSubmit} className="brui-sidebar-input-content">
                    
                    <div className='brui-sidebar-input-row'>
                        <SidebarInput.InputField/>
                    </div>
                    <div className='brui-sidebar-action-row'>
                        <div className='brui-sidebar-toggles'>
                            <Checkbox
                                label="Act"
                                data-size="sm"
                                checked={actMode}
                                onChange={(e) => setActMode(e.target.checked)}
                            />
                            <Checkbox
                                label="Show reasoning"
                                data-size="sm"
                                checked={showThinking}
                                onChange={(e) => setShowThinking(e.target.checked)}
                            />
                            <Checkbox
                                label="Auto confirm"
                                data-size="sm"
                                checked={autoConfirm}
                                onChange={handleAutoConfirmChange}
                            />
                            {includePageContext && (
                                <Checkbox
                                    label="Page context"
                                    data-size="sm"
                                    checked={pageContextActive}
                                    onChange={(e) => setPageContextActive(e.target.checked)}
                                />
                            )}
                        </div>
                        <Input hidden value={currentMode} readOnly name="contextChoice" />
                        <SidebarInput.Submit/>
                    </div>
                </form>
            )}
        </div>
    )
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: InputSubmitButton
});

export default SidebarInput;
