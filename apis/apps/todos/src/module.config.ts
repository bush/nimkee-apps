import { localDocClientProvider, prodDocClientProvider } from '@app/electrodb'
import { TodosElectroDBRepoModule } from './todos/repositories/electrodb/todos-repostitory.module';

// This is for build-time configuration.  Here we can wire out modules in various ways
// depending on which adapters we want to use.

// Todos Repository Provider
//export const todosRepositoryModule = TodosMongoDBModule;

// Here we can switch to the remote dynambo db configuration when we deploy to production.
export const todosRepositoryModule = TodosElectroDBRepoModule.register(localDocClientProvider);
//export const todosRepositoryModule = TodosElectroDBRepoModule.register(prodDocClientProvider);

// Configure other adapters here ...

