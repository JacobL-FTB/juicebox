const { client, getAllUsers, createUser } = require('./index');

async function dropTables() {
  try {
    console.log('Starting to drop tables...');
    await client.query(`
        DROP TABLE IF EXISTS users;
        `);
    console.log('Finished dropping tables');
  } catch (error) {
    throw error;
  }
}

async function createTables() {
  try {
    console.log('Starting to create tables...');
    await client.query(`
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL
        );`);
    console.log('Finished building tables');
  } catch (error) {
    throw error;
  }
}
async function createInitialUsers() {
  try {
    console.log('Starting to create users...');
    const albert = await createUser({
      username: 'albert',
      password: 'bertie99',
    });
    const sandra = await createUser({
      username: 'sandra',
      password: '2sandy4me',
    });
    const glamgal = await createUser({
      username: 'glamgal',
      password: 'soglam',
    });
    console.log('Finished creating users');
  } catch (error) {
    throw error;
  }
}

async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (error) {
    throw error;
  }
}

async function testDB() {
  try {
    console.log('starting to test database');
    const users = await getAllUsers();
    console.log('getAllUsers: ', users);
    console.log('Finshed Database Test');
  } catch (error) {
    console.error(error);
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
