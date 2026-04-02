import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseOptions } from './interfaces/database-options.interface';

export interface DatabaseModuleOptions extends DatabaseOptions {
  /** Entity classes to register with TypeORM */
  entities?: Type[];
  /** Additional providers (repositories, services) to register and export */
  providers?: Provider[];
}

@Module({})
export class DatabaseModule {
  /**
   * Register the database module with connection options.
   * Entities and domain-specific providers are passed in by the consuming app.
   *
   * @example
   * DatabaseModule.register({
   *   host: 'localhost', port: 5432, username: 'postgres', password: '', database: 'mydb',
   *   entities: [Student, Lesson],
   *   providers: [StudentRepository, LessonRepository],
   * })
   */
  static register(options: DatabaseModuleOptions): DynamicModule {
    const entities = options.entities ?? [];
    const extraProviders = options.providers ?? [];

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          database: options.database,
          entities,
          synchronize: false,
        }),
        ...(entities.length > 0 ? [TypeOrmModule.forFeature(entities)] : []),
      ],
      providers: [...extraProviders],
      exports: [TypeOrmModule, ...extraProviders],
    };
  }
}
