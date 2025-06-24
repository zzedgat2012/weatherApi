import { AfterInsert, BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { debugDB, logger } from "../config/logger";

@Entity()
export class WeatherLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("text")
    city!: string;

    @Column("real")
    temperature!: number;

    @Column("text")
    description!: string;

    @Column("real", { nullable: true })
    humidity?: number;

    @Column("real", { nullable: true })
    windSpeed?: number;

    @Column("real", { nullable: true })
    windDirection?: number;

    @Column("real", { nullable: true })
    pressure?: number;

    @Column("datetime")
    timestamp!: Date;

    @BeforeInsert()
    private beforeInsert(): void {
        debugDB('WeatherLog entity before insert', {
            city: this.city,
            temperature: this.temperature,
            description: this.description
        });
        
        logger.info('Weather log entity prepared for insertion', {
            city: this.city,
            temperature: this.temperature,
            description: this.description
        });
    }

    @AfterInsert()
    private afterInsert(): void {
        debugDB('WeatherLog entity after insert', {
            id: this.id,
            city: this.city,
            timestamp: this.timestamp
        });
        
        logger.info('Weather log entity successfully inserted', {
            id: this.id,
            city: this.city,
            timestamp: this.timestamp
        });
    }

    /**
     * Convert entity to DTO format
     */
    toDTO(): any {
        return {
            id: this.id,
            city: this.city,
            temperature: this.temperature,
            description: this.description,
            humidity: this.humidity,
            windSpeed: this.windSpeed,
            windDirection: this.windDirection,
            pressure: this.pressure,
            timestamp: this.timestamp
        };
    }

    /**
     * Convert entity to JSON format
     */
    toJSON(): any {
        return this.toDTO();
    }
}
