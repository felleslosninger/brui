import { Textarea } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';
import { useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { useChatContext } from '../ChatContext';

interface InputFieldProps {
    children?: string;
    className?: string;
}

export default function InputField({ children, className }: InputFieldProps) {
    const { inputValue, setInputValue, textareaRef, mic } = useChatContext();

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            form?.requestSubmit();
        }
    }, []);

    const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    }, [setInputValue]);

    const isProcessing = mic.state === 'processing';

    return (
        <div className="brui-input-field-wrap">
            <Textarea
                ref={textareaRef}
                name={'chatMessage'}
                className={cl('brui-input-field', className)}
                placeholder={children ?? 'How can I help you'}
                rows={1}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                aria-busy={isProcessing}
            />
        </div>
    );
}
