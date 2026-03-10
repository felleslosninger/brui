import { Button } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';
import { PaperplaneIcon } from '@navikt/aksel-icons';

interface InputSubmitButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export default function InputSubmitButton({ children, className }: InputSubmitButtonProps) {
    return (
        <Button variant={'secondary'} className={cl('brui-input-button', className)} data-size="sm" type={'submit'}>
            {children ?? 
                <>
                    <PaperplaneIcon title="send-chat" className='brui-icon' />
                    Send
                </>}
        </Button>
    );
}