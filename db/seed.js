const {
  client,
  getUserById,
  getAllPosts,
  getAllUsers,
  createUser,
  updateUser,
  updatePost,
  getPostsByUser,
  createPost,
  getPostsByTagName,
} = require('./index');

//Drops ALL tables out of the database
async function dropTables() {
  try {
    console.log('Starting to drop tables...');
    await client.query(`
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
        `);
    console.log('Finished dropping tables');
  } catch (error) {
    throw error;
  }
}

//Creates tables in the database, and
//gives them parameters to follow
async function createTables() {
  try {
    console.log('Starting to create tables...');
    await client.query(`
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT true
        );`);
    await client.query(`
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            authorid INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );`);
    await client.query(`
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );`);
    await client.query(`
        CREATE TABLE post_tags (
            postid INTEGER REFERENCES posts(id),
            tagid INTEGER REFERENCES tags(id),
            UNIQUE (postid, tagid)
        );
        `);
    console.log('Finished building tables');
  } catch (error) {
    throw error;
  }
}

//Creates users and adds them to the Users table
async function createInitialUsers() {
  try {
    console.log('Starting to create users...');
    const albert = await createUser({
      username: 'albert',
      password: 'bertie99',
      name: 'albert',
      location: 'the sun',
    });
    const sandra = await createUser({
      username: 'sandra',
      password: '2sandy4me',
      name: 'sandra',
      location: 'The Sahara Desert',
    });
    const glamgal = await createUser({
      username: 'glamgal',
      password: 'soglam',
      name: 'glammy',
      location: 'Earths orbit',
    });
    console.log('Finished creating users');
  } catch (error) {
    throw error;
  }
}

//Creates a list of initial posts
async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();
    await createPost({
      authorid: albert.id,
      title: 'First Post',
      content: 'This is my first post!',
      tags: ['#happy', '#youcandoanything'],
    });
    await createPost({
      authorid: sandra.id,
      title: 'Sand',
      content: 'I like sand... probably too much.',
      tags: ['#happy', '#worst-day-ever'],
    });
    await createPost({
      authorid: glamgal.id,
      title: 'Glam',
      content: 'Im the glammiest glam girl to ever glam.',
      tags: ['#happy', '#youcandoanything', '#catmandoeverything'],
    });
  } catch (error) {
    throw error;
  }
}

//Rebuilds the database by invoking all of the functions
async function rebuildDB() {
  try {
    client.connect();
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
  } catch (error) {
    throw error;
  }
}

//Tests the code and the database using functions
//from both Seed.js, and Index.js
async function testDB() {
  try {
    console.log('starting to test database');
    const users = await getAllUsers();

    console.log('Getting ALL posts');
    const posts = await getAllPosts();
    console.log('Results:', posts);

    console.log('Calling updateUser on users[0]');
    const updateUserResult = await updateUser(users[0].id, {
      name: 'Newname Sogood',
      location: 'Lesterville, KY',
    });
    console.log('Result:', updateUserResult);

    console.log('Calling updatePost on posts[0]');
    const updatePostResult = await updatePost(posts[0].id, {
      title: 'New Title',
      content: 'Updated Content',
      tags: ['#bluefish', '#redfish'],
    });
    console.log('Results:', updatePostResult);

    console.log('Getting user by id');
    const getuserid = await getUserById(1);
    console.log('Result:', getuserid);

    console.log('Getting posts by user (1)');
    const userposts = await getPostsByUser(1);
    console.log('Results:', userposts);

    console.log('Gettings Posts by tag name with TagName #Happy');
    const postWithHappy = await getPostsByTagName('#happy');
    console.log('Result:', postWithHappy);

    console.log('Finshed Database Test');
  } catch (error) {
    console.error(error);
  }
}

//Invokes the database tests, then ends client connection.
rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
