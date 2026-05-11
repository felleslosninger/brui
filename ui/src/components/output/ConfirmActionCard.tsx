import { useState } from 'react';
import { Button, Textfield } from '@digdir/designsystemet-react';
import type { PlannedActionEvent } from '../../../../client/eventHandlers';

interface ConfirmActionCardProps {
    actions: PlannedActionEvent[];
    onConfirm: (editedActions: PlannedActionEvent[]) => void;
    onCancel: () => void;
}

export default function ConfirmActionCard({ actions, onConfirm, onCancel }: ConfirmActionCardProps) {
    const [editing, setEditing] = useState(false);
    const [editedParams, setEditedParams] = useState<Record<string, unknown>[]>(
        () => actions.map((a) => ({ ...a.parameters }))
    );

    function handleParamChange(actionIndex: number, key: string, value: string) {
        setEditedParams((prev) => {
            const copy = [...prev];
            copy[actionIndex] = { ...copy[actionIndex], [key]: value };
            return copy;
        });
    }

    function handleConfirm() {
        if (editing) {
            const edited = actions.map((action, i) => ({
                ...action,
                parameters: editedParams[i],
            }));
            onConfirm(edited);
        } else {
            onConfirm(actions);
        }
    }

    return (
        <div className="brui-confirm-actions">
            <div className="brui-confirm-actions-text" data-size="sm">
                Run {actions.length === 1 ? 'this action' : 'these actions'}?
            </div>
            <ul className="brui-confirm-actions-details">
                {actions.map((action, actionIndex) => {
                    const params = editing ? editedParams[actionIndex] : action.parameters;
                    const entries = Object.entries(params).filter(
                        ([, v]) => v != null && v !== ''
                    );
                    return (
                        <li key={action.id} className="brui-confirm-action-item">
                            <strong>{action.label || action.action}</strong>
                            {entries.length > 0 && (
                                <ul className="brui-confirm-action-params">
                                    {entries.map(([key, value]) => (
                                        <li key={key}>
                                            {editing ? (
                                                <Textfield
                                                    data-size="sm"
                                                    label={key}
                                                    value={String(value)}
                                                    onChange={(e) =>
                                                        handleParamChange(actionIndex, key, e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <>
                                                    <span className="brui-confirm-param-key">{key}:</span>{' '}
                                                    <span className="brui-confirm-param-value">{String(value)}</span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
            <div className="brui-confirm-actions-buttons">
                <Button data-size="sm" onClick={handleConfirm}>
                    Confirm
                </Button>
                {!editing && (
                    <Button data-size="sm" variant="secondary" onClick={() => setEditing(true)}>
                        Edit
                    </Button>
                )}
                <Button data-size="sm" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
