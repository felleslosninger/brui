import cl from "clsx";

import { Dropdown } from "@digdir/designsystemet-react";

interface ContextDropdownProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ContextDropdown({ children, className }: ContextDropdownProps) {
    return (
        <div className={cl('context-dropdown', className)}>
            <Dropdown.TriggerContext>
                <Dropdown.Trigger>
                    Dropdown
                </Dropdown.Trigger>
                <Dropdown placement="bottom-end">
                    <Dropdown.Heading>
                        First heading
                    </Dropdown.Heading>
                    <Dropdown.List>
                        <Dropdown.Item>
                            <Dropdown.Button>
                                Button 1.1
                            </Dropdown.Button>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Dropdown.Button>
                                Button 1.2
                            </Dropdown.Button>
                        </Dropdown.Item>
                    </Dropdown.List>
                    <Dropdown.Heading>
                        Second heading
                    </Dropdown.Heading>
                    <Dropdown.List>
                        <Dropdown.Item>
                            <Dropdown.Button>
                                Button 2.1
                            </Dropdown.Button>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Dropdown.Button>
                                Button 2.2
                            </Dropdown.Button>
                        </Dropdown.Item>
                    </Dropdown.List>
                </Dropdown>
            </Dropdown.TriggerContext>
        </div>
    )
}