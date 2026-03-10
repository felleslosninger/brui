import cl from 'clsx/lite';

import { Dropdown, Input } from '@digdir/designsystemet-react';
import { ChevronUpIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { Mode } from "../../types/message";

interface InputContextDropdownProps {
    modes: Mode[];
    className?: string;
}

export default function InputContextDropdown({ modes, className }: InputContextDropdownProps) {
    const [selectedContext, setSelectedContext] = useState<string>(modes[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className={cl('sidebar-context-menu', className)}>
            <Dropdown.TriggerContext>
                <Dropdown.Trigger
                    className="sidebar-context-menu-trigger"
                    variant='secondary'
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    {selectedContext}
                    <ChevronUpIcon title="chevron-up" />
                </Dropdown.Trigger>
                <Dropdown
                    open={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    placement="bottom-end"
                >
                    <Dropdown.Heading>
                        Modes
                    </Dropdown.Heading>
                    <Dropdown.List>
                        {modes.map((page) => (
                            <Dropdown.Item key={page}>
                                <Dropdown.Button
                                    onClick={() => {
                                        setSelectedContext(page);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={selectedContext === page ? 'dropdown-item-selected' : ''}
                                >
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