import "dotenv/config";
import "reflect-metadata";
import { WeatherApp } from "./app";

async function main() {
    try {
        console.log('🚀 Starting Weather API...');
        
        const app = new WeatherApp();
        await app.initialize();
        await app.start();
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            await app.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM received, shutting down gracefully...');
            await app.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Weather API:', error);
        process.exit(1);
    }
}

main();
