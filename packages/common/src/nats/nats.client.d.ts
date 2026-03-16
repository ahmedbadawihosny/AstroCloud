export type NatsConfig = {
    servers: string[];
};
export declare class NatsClient {
    private nc;
    private sc;
    connect(cfg: NatsConfig): Promise<void>;
    publish(subject: string, payload: unknown): Promise<void>;
    subscribe(subject: string, handler: (payload: unknown) => Promise<void> | void): void;
    close(): Promise<void>;
}
