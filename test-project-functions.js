import { createDatabase, initDatabase, getOrCreateProject, incrementProjectCounter } from './src/db.js';
import { createLogger } from './src/logger.js';

const logger = createLogger();

async function testProjectFunctions() {
    try {
        //initializing the DB
        const db = createDatabase();
        await initDatabase(db, logger);

        console.log('Test 1: new project creation');
        const testProjectName = 'TEST';
        const newProject = await getOrCreateProject(db, logger, testProjectName);
        console.log('New project created:', newProject);

        console.log('Test 2: getting existing project');
        const existingProject = await getOrCreateProject(db, logger, testProjectName);
        console.log('Existing project fetched:', existingProject);

        console.log('Test 3: counter increment');
        const firstNumber = await incrementProjectCounter(db, logger, testProjectName);
        console.log('First number:', firstNumber);

        const secondNumber = await incrementProjectCounter(db, logger, testProjectName);
        console.log('Second number:', secondNumber);

        const thirdNumber = await incrementProjectCounter(db, logger, testProjectName);
        console.log('Third number:', thirdNumber);

        console.log('Test 4: autoincrement with project creation');
        const anotherTestProjectName = 'TEST1';
        const fourthNumber = await incrementProjectCounter(db, logger, anotherTestProjectName);
        console.log('Number for', anotherTestProjectName, fourthNumber);

        console.log('all test passed successfully!');

    } catch (error) {
        console.log('Tests failed:', error.message);
    }
}

testProjectFunctions();
