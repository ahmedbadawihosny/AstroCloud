import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NatsClient } from './nats.client';
export declare class NatsModule implements OnModuleInit, OnModuleDestroy {
    private readonly nats;
    constructor(nats: NatsClient);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
