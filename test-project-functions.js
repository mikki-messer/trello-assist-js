const { initDatabase, getOrCreateProject, incrementProjectCounter} = require('./db');

async function testProjectFunctions() {
    try {
        //initializing the DB
        await initDatabase();

        console.log('Test 1: new project creation');
        let testProjectName = 'TEST';
        const newProject = await getOrCreateProject(testProjectName);
        console.log('New project created:', newProject);

        console.log('Test 2: getting existing project');
        const existingProject = await getOrCreateProject(testProjectName);
        console.log('Existing project fetched:', existingProject);

        console.log('Test 3: counter increment');
        const firstNumber = await incrementProjectCounter(testProjectName);
        console.log('First number:', firstNumber);

        const secondNumber = await incrementProjectCounter(testProjectName);
        console.log('Second number:', secondNumber);

        const thirdNumber = await incrementProjectCounter(testProjectName);
        console.log('Third number:', thirdNumber);

        console.log('Test 4: autoincrement with project creation');
        let anotherTestProjectName = 'TEST1';
        const fourthNumber = await incrementProjectCounter(anotherTestProjectName);
        console.log('Number for', anotherTestProjectName, fourthNumber);

        console.log('all test passed successfully!');

    } catch (error) {
        console.log('Tests failed:', error.message);
    }
}

testProjectFunctions();