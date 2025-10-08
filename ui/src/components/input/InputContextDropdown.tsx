import cl from 'clsx/lite';

import { Dropdown, Input } from "@digdir/designsystemet-react";
import { ChevronUpIcon } from "@navikt/aksel-icons";
import { useState } from "react";

interface InputContextDropdownProps {
    className?: string;
}

export default function InputContextDropdown({ className }: InputContextDropdownProps) {
    const [selectedContext, setSelectedContext] = useState<string>("This page");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className={cl('sidebar-context-menu', className)}>
            <Dropdown.TriggerContext>
                <Dropdown.Trigger
                    className="sidebar-context-menu-trigger"
                    data-size="sm"
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
                        Pages
                    </Dropdown.Heading>
                    <Dropdown.List>
                        {["This page", "Home", "Menu", "Order"].map((page) => (
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