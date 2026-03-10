import cl from 'clsx/lite';
import InputField from './InputField';
import InputSubmitButton from './InputSubmitButton';
import InputMicrophoneButton from './InputMicrophoneButton';
import InputContextDropdown from './InputContextDropdown';
import { useSidebarContext } from '../SidebarContext';

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
}

function SidebarInputRoot({ children, className }: SidebarInputProps) {
    const { handleSubmit, modes } = useSidebarContext();

    return (
<<<<<<< Updated upstream
        <div className={cl('sidebar-input', className)}>
            {children ? (
                children
            ) : (
                <form onSubmit={onSubmit} className="sidebar-input-content">
                    <SidebarInput.ContextMenu modes={modes} />
                    <div className='brui-sidebar-input'>
=======
        <div className={cl('brui-sidebar-input', className)}>
            {children ?? (
                <form onSubmit={handleSubmit} className="brui-sidebar-input-content">
                    
                    <div className='brui-sidebar-input-row'>
>>>>>>> Stashed changes
                        <SidebarInput.InputField/>
                    </div>
                    <div className='brui-sidebar-action-row'>
                        <SidebarInput.ContextMenu modes={modes}/>
                        <SidebarInput.Submit/>
                    </div>
                </form>
            )}
        </div>
    )
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    ContextMenu: InputContextDropdown,
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: InputSubmitButton
});

export default SidebarInput;