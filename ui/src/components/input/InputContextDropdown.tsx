import cl from 'clsx/lite';

import { Dropdown, Input } from '@digdir/designsystemet-react';
import { ChevronUpIcon, FileTextIcon, GavelIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { Mode } from '../../types/message';

const modeIcons: Record<Mode, React.ReactNode> = {
    Info: <FileTextIcon aria-hidden />,
    Act: <GavelIcon aria-hidden />,
};

interface InputContextDropdownProps {
    children?: React.ReactNode;
    modes: Mode[];
    className?: string;
}

export default function InputContextDropdown({ children, modes, className }: InputContextDropdownProps) {
    const [selectedContext, setSelectedContext] = useState<string>(modes[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className={cl('brui-context-menu', className)} data-size={'sm'}>
            <Dropdown.TriggerContext>
                <Dropdown.Trigger
                    className="brui-context-menu-trigger"
                    variant='tertiary'
                    data-size='sm'
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    {modeIcons[selectedContext as Mode]}
                    {selectedContext}
                    <ChevronUpIcon title="chevron-up" />
                </Dropdown.Trigger>
                <Dropdown
                    open={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    placement="bottom-end"
                >
                    <Dropdown.Heading>
                        {children ?? 'Modes'}
                    </Dropdown.Heading>
                    <Dropdown.List>
                        {modes.map((page) => (
                            <Dropdown.Item key={page}>
                                <Dropdown.Button
                                    onClick={() => {
                                        setSelectedContext(page);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={selectedContext === page ? 'brui-dropdown-item-selected' : ''}
                                >
                                    {modeIcons[page]}
                                    {page}
                                </Dropdown.Button>
                            </Dropdown.Item>
                        ))}
                    </Dropdown.List>
                </Dropdown>
            </Dropdown.TriggerContext>

            <Input hidden value={selectedContext} readOnly name="contextChoice" />
        </div>
    )
}
