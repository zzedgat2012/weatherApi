import { AfterInsert, BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { debugDB, logger } from "../config/logger";
import { LoggableClass, LogMethod } from "../decorators";

@LoggableClass
@Entity()
export class WeatherLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    city!: string;

    @Column({ type: 'text' })
    temperature!: string;

    @Column({ type: 'text' })
    humidity!: string;

    @Column({ type: 'text' })
    conditions!: string;

    @Column({ type: 'text', default: 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @BeforeInsert()
    @LogMethod
    private validateBeforeInsert(): void {
        debugDB(`Validating weather log before insert for city: ${this.city}`);
        logger.debug('Weather log validation', { city: this.city });
        
        if (!this.city || this.city.trim().length === 0) {
            throw new Error('City is required');
        }
        if (!this.temperature) {
            throw new Error('Temperature is required');
        }
        if (!this.humidity) {
            throw new Error('Humidity is required');
        }
        if (!this.conditions) {
            throw new Error('Conditions are required');
        }
    }

    @AfterInsert()
    @LogMethod
    private logAfterInsert(): void {
        debugDB(`Weather log inserted successfully with ID: ${this.id}`);
        logger.info('Weather log created', { 
            id: this.id, 
            city: this.city,
            temperature: this.temperature 
        });
    }

    @LogMethod
    public toString(): string {
        return `WeatherLog(id=${this.id}, city=${this.city}, temp=${this.temperature}, humidity=${this.humidity}, conditions=${this.conditions})`;
    }

    @LogMethod
    public toJSON(): object {
        return {
            id: this.id,
            city: this.city,
            temperature: this.temperature,
            humidity: this.humidity,
            conditions: this.conditions,
            createdAt: this.createdAt
        };
    }
}
