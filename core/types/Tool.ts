export interface Tool {
    type: string,
    function: {
        name: string,
        description: string,
        parameters: {
            type: string,
            required: string[],
            properties: Record<string, { type: string, description: string }>
        }
    }
}