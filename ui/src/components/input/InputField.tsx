import { Textarea } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';
import { useCallback, type KeyboardEvent } from 'react';

interface InputFieldProps {
    children?: string;
    className?: string;
}

export default function InputField({ children, className }: InputFieldProps) {
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const form = e.currentTarget.closest('form');
            form?.requestSubmit();
        }
    }, []);

    return (
        <Textarea
            name={'chatMessage'}
            className={cl('brui-input-field', className)}
            placeholder={children ?? 'How can I help you'}
            rows={1}
            onKeyDown={handleKeyDown}
        />
    );
}